const express = require('express');
const { Op, Sequelize } = require('sequelize');
const {
    AnalyticsEvent, sequelize, ModerationAction, Reflection, Song, User, UserWarning,
} = require('../models');
const { optionalAuth, requireAuth, requireCreatorOrAdmin } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MODERATION_STATUSES = new Set(['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED']);
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
        account: value.user
            ? { id: value.user.id, name: value.user.name, email: value.user.email, accountStatus: value.user.accountStatus }
            : null,
        song: value.song ? {
            id: value.song.id,
            title: value.song.title,
            creator: value.song.creator ? { id: value.song.creator.id, name: value.song.creator.name, email: value.song.creator.email } : null,
        } : null,
        userId: value.userId,
    };
}

function reflectionIncludes({ creatorId = null, includeModerator = false, publishedOnly = false } = {}) {
    const songWhere = publishedOnly
        ? { creatorId: { [Op.ne]: null }, status: 'PUBLISHED' }
        : creatorId ? { creatorId } : undefined;
    const includes = [{
        model: Song,
        as: 'song',
        attributes: ['id', 'title', 'creatorId'],
        include: [{ model: User, as: 'creator', attributes: ['id', 'name', 'email'], required: false }],
        ...(songWhere ? { required: true, where: songWhere } : {}),
    }];

    if (includeModerator) {
        includes.push({ model: User, as: 'moderator', attributes: ['id', 'name', 'role'], required: false });
        includes.push({ model: User, as: 'user', attributes: ['id', 'name', 'email', 'accountStatus'], required: false });
    }

    return includes;
}

async function findReflection(id, { creatorId = null, includeModerator = false, transaction } = {}) {
    if (!UUID_PATTERN.test(id)) return null;

    return Reflection.findByPk(id, {
        include: reflectionIncludes({ creatorId, includeModerator }),
        transaction,
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

    if (!UUID_PATTERN.test(songId)) return { error: 'Please choose a valid published song.' };
    if (!(await Song.findOne({ where: { creatorId: { [Op.ne]: null }, id: songId, status: 'PUBLISHED' }, attributes: ['id'] }))) return { error: 'Please choose a valid published song.' };
    if (Object.prototype.hasOwnProperty.call(body, 'isAnonymous') && typeof body.isAnonymous !== 'boolean') return { error: 'isAnonymous must be true or false.' };
    if (Object.prototype.hasOwnProperty.call(body, 'displayMode') && !['PROFILE', 'ANONYMOUS'].includes(body.displayMode)) return { error: 'displayMode must be PROFILE or ANONYMOUS.' };
    const submittedTags = getSubmittedTags(body);
    if (submittedTags !== undefined && !Array.isArray(submittedTags)) return { error: 'tags must be an array.' };

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

async function getModerationStats(creatorId = null) {
    const { startYesterday, startToday, startTomorrow } = singaporeDayBoundaries();
    const count = (where) => Reflection.count({
        where,
        ...(creatorId ? {
            distinct: true,
            include: reflectionIncludes({ creatorId }),
        } : {}),
    });
    const [pending, approved, flagged, rejected, newToday, newYesterday] = await Promise.all([
        count({ status: 'PENDING' }),
        count({ status: 'APPROVED' }),
        count({ status: 'FLAGGED' }),
        count({ status: 'REJECTED' }),
        count({ createdAt: { [Op.gte]: startToday, [Op.lt]: startTomorrow } }),
        count({ createdAt: { [Op.gte]: startYesterday, [Op.lt]: startToday } }),
    ]);

    return { pending, approved, flagged, rejected, newToday, newYesterday };
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

router.get('/moderation', requireCreatorOrAdmin, async (req, res, next) => {
    try {
        const creatorId = req.authUserRecord.role === 'CREATOR' ? req.authUserRecord.id : null;
        const status = String(req.query.status || 'PENDING').toUpperCase();
        if (!MODERATION_STATUSES.has(status)) {
            return res.status(400).json({ message: 'Status must be PENDING, APPROVED, FLAGGED, or REJECTED.' });
        }

        const songId = req.query.songId?.trim();
        if (songId && !UUID_PATTERN.test(songId)) {
            return res.status(400).json({ message: 'songId must be a valid song id.' });
        }
        if (songId && creatorId) {
            const ownedSong = await Song.findOne({ where: { id: songId, creatorId }, attributes: ['id'] });
            if (!ownedSong) return res.status(404).json({ message: 'Song not found.' });
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
                include: reflectionIncludes({ creatorId, includeModerator: true }),
                distinct: true,
                limit,
                offset: (page - 1) * limit,
                order: [['createdAt', 'DESC'], ['id', 'ASC']],
                subQuery: false,
            }),
            getModerationStats(creatorId),
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

router.get('/mine', requireAuth, async (req, res, next) => {
    try {
        const reflections = await Reflection.findAll({
            where: { userId: req.authUser.id },
            include: [{ model: Song, as: 'song', attributes: ['id', 'title', 'coverImageUrl'] }],
            order: [['createdAt', 'DESC']],
        });
        return res.json({ reflections: reflections.map((reflection) => serializeReflection(reflection, req.authUser.id)) });
    } catch (error) { return next(error); }
});

router.get('/', optionalAuth, async (req, res, next) => {
    try {
        const where = { status: 'APPROVED' };
        const search = req.query.search?.trim();
        const songId = req.query.songId?.trim();

        if (songId) {
            if (!UUID_PATTERN.test(songId)) return res.status(400).json({ message: 'songId must be a valid published song id.' });
            const publishedSong = await Song.findOne({ where: { creatorId: { [Op.ne]: null }, id: songId, status: 'PUBLISHED' }, attributes: ['id'] });
            if (!publishedSong) return res.status(404).json({ message: 'Published song not found.' });
            where.songId = songId;
        }
        if (search) where.content = { [Op.like]: `%${search}%` };

        const reflections = await Reflection.findAll({
            where,
            include: reflectionIncludes({ publishedOnly: true }),
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

        if (req.get('authorization') && !req.authUser?.id) return res.status(401).json({ message: 'Your session is invalid or expired.' });
        const user = req.authUser?.id ? await User.findByPk(req.authUser.id) : null;
        if (req.authUser?.id && !user) return res.status(401).json({ message: 'Your account could not be found.' });
        const guestSubmission = !user;
        const displayMode = guestSubmission || req.body.displayMode === 'ANONYMOUS' || req.body.isAnonymous
            ? 'ANONYMOUS'
            : 'PROFILE';

        const reflection = await sequelize.transaction(async (transaction) => {
            const createdReflection = await Reflection.create({
                content: input.content,
                displayMode,
                displayName: displayMode === 'PROFILE' ? user.name : null,
                guestSubmission,
                songId: input.songId,
                status: 'PENDING',
                tags: normalizeTags(getSubmittedTags(req.body)),
                userId: user?.id || null,
            }, { transaction });
            await AnalyticsEvent.create({
                eventType: 'REFLECTION_SUBMITTED',
                metadata: {},
                songId: input.songId,
                userId: user?.id || null,
            }, { transaction });
            return createdReflection;
        });

        const created = await findReflection(reflection.id);
        return res.status(201).json({
            reflection: serializeReflection(created, user?.id, { includeSubmissionMetadata: true }),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/:id/moderation', requireCreatorOrAdmin, async (req, res, next) => {
    try {
        const creatorId = req.authUserRecord.role === 'CREATOR' ? req.authUserRecord.id : null;
        const reflection = await findReflection(req.params.id, { creatorId });
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
                return res.status(400).json({ message: 'Status must be PENDING, APPROVED, FLAGGED, or REJECTED.' });
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

        await sequelize.transaction(async (transaction) => {
            await reflection.update(updates, { transaction });
            await ModerationAction.create({
                actionType: updates.status ? `REFLECTION_${updates.status}` : 'REFLECTION_NOTE_UPDATED',
                actorId: req.authUserRecord.id,
                metadata: { moderatorNoteChanged: hasModeratorNote },
                reason: updates.moderatorNote || null,
                songId: reflection.songId,
                targetId: reflection.id,
                targetType: 'REFLECTION',
                targetUserId: reflection.userId,
            }, { transaction });
            await writeAudit({
                action: 'REFLECTION_MODERATED',
                actorId: req.authUserRecord.id,
                creatorId: reflection.song.creatorId || creatorId,
                entityId: reflection.id,
                entityType: 'REFLECTION',
                metadata: { status: updates.status || reflection.status },
                req,
                songId: reflection.songId,
                transaction,
            });
        });
        const updated = await findReflection(reflection.id, { creatorId, includeModerator: true });
        return res.json({
            reflection: serializeModerationReflection(updated, req.authUserRecord.id),
        });
    } catch (error) {
        return next(error);
    }
});

router.post('/:id/warn', requireCreatorOrAdmin, async (req, res, next) => {
    try {
        const creatorId = req.authUserRecord.role === 'CREATOR' ? req.authUserRecord.id : null;
        const reflection = await findReflection(req.params.id, { creatorId });
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        if (!reflection.userId) return res.status(400).json({ message: 'Guest submissions cannot receive account warnings.' });

        const reason = String(req.body.reason || '').trim();
        if (reason.length < 5 || reason.length > 2000) {
            return res.status(400).json({ message: 'Warning reason must be between 5 and 2000 characters.' });
        }

        const warning = await sequelize.transaction(async (transaction) => {
            const createdWarning = await UserWarning.create({
                issuedBy: req.authUserRecord.id,
                reason,
                userId: reflection.userId,
            }, { transaction });
            await ModerationAction.create({
                actionType: 'USER_WARNED_FROM_REFLECTION',
                actorId: req.authUserRecord.id,
                metadata: { warningId: createdWarning.id },
                reason,
                songId: reflection.songId,
                targetId: reflection.id,
                targetType: 'REFLECTION',
                targetUserId: reflection.userId,
            }, { transaction });
            await writeAudit({
                action: 'USER_WARNED_FROM_REFLECTION',
                actorId: req.authUserRecord.id,
                creatorId: reflection.song.creatorId,
                entityId: createdWarning.id,
                entityType: 'USER_WARNING',
                metadata: { reflectionId: reflection.id, targetUserId: reflection.userId },
                req,
                songId: reflection.songId,
                transaction,
            });
            return createdWarning;
        });
        return res.status(201).json({ warning });
    } catch (error) { return next(error); }
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
        const currentUser = req.authUserRecord;
        const creatorId = currentUser.role === 'CREATOR' ? currentUser.id : null;
        const reflection = await findReflection(req.params.id, { creatorId });
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        const isOwner = reflection.userId === currentUser.id;
        const canModerate = currentUser.role === 'ADMIN' || currentUser.role === 'CREATOR';
        if (!isOwner && !canModerate) {
            return res.status(403).json({ message: 'You can only delete your own reflections.' });
        }
        await sequelize.transaction(async (transaction) => {
            if (canModerate && !isOwner) {
                await ModerationAction.create({
                    actionType: 'REFLECTION_REJECTED', actorId: currentUser.id,
                    songId: reflection.songId, targetId: reflection.id,
                    targetType: 'REFLECTION', targetUserId: reflection.userId,
                }, { transaction });
                await reflection.update({
                    moderatedAt: new Date(),
                    moderatedBy: currentUser.id,
                    moderatorNote: 'Removed from public view by a moderator.',
                    status: 'REJECTED',
                }, { transaction });
            } else {
                await reflection.destroy({ transaction });
            }
            await writeAudit({
                action: canModerate && !isOwner ? 'REFLECTION_REJECTED' : 'REFLECTION_DELETED', actorId: currentUser.id,
                creatorId: reflection.song.creatorId || creatorId, entityId: reflection.id, entityType: 'REFLECTION',
                req, songId: reflection.songId, transaction,
            });
        });
        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
