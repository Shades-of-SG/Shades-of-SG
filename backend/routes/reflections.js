const express = require('express');
const { Op, Sequelize } = require('sequelize');
const { sequelize, Reflection, Song, User } = require('../models');
const { optionalAuth, requireAuth, requireCreator } = require('../middleware/auth');

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODERATION_STATUSES = new Set(['PENDING', 'APPROVED', 'FLAGGED']);
const KNOWN_TAGS = new Map([
    'Nostalgia',
    'Family',
    'National Day',
    'Friendship',
    'School',
    'Home',
].map((tag) => [tag.toLowerCase(), tag]));
const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function normalizeTags(tags) {
    if (!Array.isArray(tags)) return [];

    return tags.reduce((result, value) => {
        const normalized = KNOWN_TAGS.get(String(value).trim().toLowerCase());
        if (normalized && !result.includes(normalized)) result.push(normalized);
        return result;
    }, []);
}

function getSubmittedTags(body) {
    if (Object.prototype.hasOwnProperty.call(body, 'tags')) return body.tags;
    if (Object.prototype.hasOwnProperty.call(body, 'memoryTypes')) return body.memoryTypes;
    return undefined;
}

function serializeReflection(reflection, currentUserId, { includeSubmissionMetadata = false } = {}) {
    const value = reflection.get({ plain: true });
    const serialized = {
        id: value.id,
        content: value.content,
        displayName: value.displayName || 'Anonymous',
        displayMode: value.displayMode,
        isAnonymous: value.displayMode === 'ANONYMOUS' || !value.displayName,
        isOwner: Boolean(currentUserId && value.userId === currentUserId),
        song: value.song ? { id: value.song.id, title: value.song.title } : null,
        songId: value.songId,
        status: value.status,
        tags: Array.isArray(value.tags) ? value.tags : [],
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
    };

    if (includeSubmissionMetadata) {
        serialized.guestSubmission = Boolean(value.guestSubmission);
    }

    return serialized;
}

function serializeModerationReflection(reflection, currentUserId) {
    const value = reflection.get({ plain: true });

    return {
        ...serializeReflection(reflection, currentUserId, { includeSubmissionMetadata: true }),
        submissionType: value.guestSubmission ? 'GUEST' : 'ACCOUNT',
        moderatedBy: value.moderatedBy,
        moderatedAt: value.moderatedAt,
        moderatorNote: value.moderatorNote,
        moderator: value.moderator
            ? { id: value.moderator.id, name: value.moderator.name }
            : null,
    };
}

function reflectionIncludes({ includeModerator = false } = {}) {
    const includes = [{ model: Song, as: 'song', attributes: ['id', 'title'] }];

    if (includeModerator) {
        includes.push({ model: User, as: 'moderator', attributes: ['id', 'name'], required: false });
    }

    return includes;
}

async function findReflection(id, { includeModerator = false } = {}) {
    if (!UUID_PATTERN.test(id)) return null;

    return Reflection.findByPk(id, {
        include: reflectionIncludes({ includeModerator }),
    });
}

async function validateInput(body) {
    const content = body.content?.trim();
    const songId = body.songId;

    if (!content || !songId) {
        return { error: 'Song and reflection are required.' };
    }

    if (content.length > 1000) {
        return { error: 'Reflection must be 1000 characters or fewer.' };
    }

    if (!UUID_PATTERN.test(songId) || !(await Song.findByPk(songId))) {
        return { error: 'Please choose a valid song.' };
    }

    return { content, songId };
}

function singaporeDayBoundaries(now = new Date()) {
    const singaporeNow = new Date(now.getTime() + SINGAPORE_OFFSET_MS);
    const startTodayMilliseconds = Date.UTC(
        singaporeNow.getUTCFullYear(),
        singaporeNow.getUTCMonth(),
        singaporeNow.getUTCDate()
    ) - SINGAPORE_OFFSET_MS;

    return {
        startYesterday: new Date(startTodayMilliseconds - ONE_DAY_MS),
        startToday: new Date(startTodayMilliseconds),
        startTomorrow: new Date(startTodayMilliseconds + ONE_DAY_MS),
    };
}

async function getModerationStats() {
    const { startYesterday, startToday, startTomorrow } = singaporeDayBoundaries();
    const [pending, approved, flagged, newToday, newYesterday] = await Promise.all([
        Reflection.count({ where: { status: 'PENDING' } }),
        Reflection.count({ where: { status: 'APPROVED' } }),
        Reflection.count({ where: { status: 'FLAGGED' } }),
        Reflection.count({
            where: { createdAt: { [Op.gte]: startToday, [Op.lt]: startTomorrow } },
        }),
        Reflection.count({
            where: { createdAt: { [Op.gte]: startYesterday, [Op.lt]: startToday } },
        }),
    ]);

    return { pending, approved, flagged, newToday, newYesterday };
}

function parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseDateFrom(value) {
    if (!value) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? new Date(`${value}T00:00:00+08:00`)
        : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

router.get('/moderation', requireCreator, async (req, res, next) => {
    try {
        const status = String(req.query.status || 'PENDING').toUpperCase();
        if (!MODERATION_STATUSES.has(status)) {
            return res.status(400).json({ message: 'Status must be PENDING, APPROVED, or FLAGGED.' });
        }

        const songId = req.query.songId?.trim();
        if (songId && !UUID_PATTERN.test(songId)) {
            return res.status(400).json({ message: 'songId must be a valid song id.' });
        }

        const dateFromValue = req.query.dateFrom?.trim();
        const dateFrom = parseDateFrom(dateFromValue);
        if (dateFromValue && !dateFrom) {
            return res.status(400).json({ message: 'dateFrom must be a valid date.' });
        }

        const page = parsePositiveInteger(req.query.page, 1);
        const limit = Math.min(parsePositiveInteger(req.query.limit, 8), 24);
        const search = req.query.search?.trim();
        const where = { status };

        if (songId) where.songId = songId;
        if (dateFrom) where.createdAt = { [Op.gte]: dateFrom };
        if (req.query.anonymousOnly === 'true' || req.query.anonymousOnly === '1') {
            where.displayMode = 'ANONYMOUS';
        }

        if (search) {
            const searchOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            const searchPattern = `%${search}%`;
            where[Op.or] = [
                { content: { [searchOperator]: searchPattern } },
                { displayName: { [searchOperator]: searchPattern } },
                { '$song.title$': { [searchOperator]: searchPattern } },
                Sequelize.where(
                    Sequelize.cast(Sequelize.col('Reflection.tags'), 'TEXT'),
                    { [searchOperator]: searchPattern }
                ),
            ];
        }

        const [{ count, rows }, stats] = await Promise.all([
            Reflection.findAndCountAll({
                where,
                include: reflectionIncludes({ includeModerator: true }),
                distinct: true,
                limit,
                offset: (page - 1) * limit,
                order: [['createdAt', 'DESC'], ['id', 'ASC']],
                subQuery: false,
            }),
            getModerationStats(),
        ]);

        return res.json({
            reflections: rows.map((item) => serializeModerationReflection(item, req.authUserRecord.id)),
            stats,
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const where = { status: 'APPROVED' };
        const search = req.query.search?.trim();
        const songId = req.query.songId?.trim();

        if (songId && UUID_PATTERN.test(songId)) where.songId = songId;
        if (search) where.content = { [Op.like]: `%${search}%` };

        const reflections = await Reflection.findAll({
            where,
            include: reflectionIncludes(),
            order: [['createdAt', req.query.sort === 'oldest' ? 'ASC' : 'DESC']],
        });

        return res.json({
            reflections: reflections.map((item) => serializeReflection(item, req.authUser?.id)),
        });
    } catch (error) {
        return next(error);
    }
});

router.post('/', optionalAuth, async (req, res, next) => {
    try {
        const input = await validateInput(req.body);
        if (input.error) return res.status(400).json({ message: input.error });

        const user = req.authUser?.id ? await User.findByPk(req.authUser.id) : null;
        if (req.authUser?.id && !user) return res.status(401).json({ message: 'Your account could not be found.' });
        const guestSubmission = !user;
        const displayMode = guestSubmission || req.body.displayMode === 'ANONYMOUS' || req.body.isAnonymous
            ? 'ANONYMOUS'
            : 'PROFILE';

        const reflection = await Reflection.create({
            content: input.content,
            displayMode,
            displayName: displayMode === 'PROFILE' ? user.name : null,
            guestSubmission,
            songId: input.songId,
            status: guestSubmission ? 'PENDING' : 'APPROVED',
            tags: normalizeTags(getSubmittedTags(req.body)),
            userId: user?.id || null,
        });

        const created = await findReflection(reflection.id);
        return res.status(201).json({
            reflection: serializeReflection(created, user?.id, { includeSubmissionMetadata: true }),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/:id/moderation', requireCreator, async (req, res, next) => {
    try {
        const reflection = await findReflection(req.params.id);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });

        const hasStatus = Object.prototype.hasOwnProperty.call(req.body, 'status');
        const hasModeratorNote = Object.prototype.hasOwnProperty.call(req.body, 'moderatorNote');
        if (!hasStatus && !hasModeratorNote) {
            return res.status(400).json({ message: 'A moderation status or moderator note is required.' });
        }

        const updates = {
            moderatedAt: new Date(),
            moderatedBy: req.authUserRecord.id,
        };

        if (hasStatus) {
            const status = String(req.body.status).toUpperCase();
            if (!MODERATION_STATUSES.has(status)) {
                return res.status(400).json({ message: 'Status must be PENDING, APPROVED, or FLAGGED.' });
            }
            updates.status = status;
        }

        if (hasModeratorNote) {
            if (req.body.moderatorNote !== null && typeof req.body.moderatorNote !== 'string') {
                return res.status(400).json({ message: 'Moderator note must be text.' });
            }

            const moderatorNote = req.body.moderatorNote?.trim() || null;
            if (moderatorNote && moderatorNote.length > 1000) {
                return res.status(400).json({ message: 'Moderator note must be 1000 characters or fewer.' });
            }
            updates.moderatorNote = moderatorNote;
        }

        await reflection.update(updates);
        const updated = await findReflection(reflection.id, { includeModerator: true });
        return res.json({
            reflection: serializeModerationReflection(updated, req.authUserRecord.id),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/:id', requireAuth, async (req, res, next) => {
    try {
        const reflection = await findReflection(req.params.id);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        if (reflection.userId !== req.authUser.id) return res.status(403).json({ message: 'You can only edit your own reflections.' });

        const input = await validateInput(req.body);
        if (input.error) return res.status(400).json({ message: input.error });

        const user = await User.findByPk(req.authUser.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        const displayMode = req.body.displayMode === 'ANONYMOUS' || req.body.isAnonymous ? 'ANONYMOUS' : 'PROFILE';
        const submittedTags = getSubmittedTags(req.body);
        await reflection.update({
            content: input.content,
            displayMode,
            displayName: displayMode === 'ANONYMOUS' ? null : user.name,
            songId: input.songId,
            tags: submittedTags === undefined ? reflection.tags : normalizeTags(submittedTags),
        });

        const updated = await findReflection(reflection.id);
        return res.json({
            reflection: serializeReflection(updated, req.authUser.id, { includeSubmissionMetadata: true }),
        });
    } catch (error) {
        return next(error);
    }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
        const reflection = await findReflection(req.params.id);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });

        const currentUser = await User.findByPk(req.authUser.id, { attributes: ['id', 'role'] });
        if (!currentUser) return res.status(401).json({ message: 'Your account could not be found.' });
        const isOwner = reflection.userId === currentUser.id;
        const isCreator = currentUser.role === 'CREATOR';
        if (!isOwner && !isCreator) {
            return res.status(403).json({ message: 'You can only delete your own reflections.' });
        }

        await reflection.destroy();
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
