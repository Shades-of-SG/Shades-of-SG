const express = require('express');
const { Op, Sequelize } = require('sequelize');
const {
    AnalyticsEvent, sequelize, ModerationAction, Reflection, ReflectionComment,
    ReflectionLike, Song, User, UserProfile, UserWarning,
} = require('../models');
const { optionalAuth, requireAuth, requireCreatorOrAdmin } = require('../middleware/auth');
const { createRateLimit } = require('../middleware/rateLimit');
const { validateCommentContent } = require('../services/commentContentService');
const { writeAudit } = require('../services/auditService');
const { evaluateAndAward } = require('../services/badgeAwardService');

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
const PUBLIC_SORTS = new Set(['latest', 'oldest', 'most_liked', 'most_discussed']);
const commentRateLimit = createRateLimit({
    key: (req) => `reflection-comments:user:${req.authUserRecord.id}`,
    max: 6,
    windowMs: 60 * 1000,
});

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

function publicAuthor(user, fallbackName) {
    if (!user) return null;
    const profile = user.profile?.get ? user.profile.get({ plain: true }) : user.profile;
    return {
        avatarUrl: profile?.avatarUrl || '',
        displayName: profile?.displayName || user.name || fallbackName || 'Community member',
        id: user.id,
    };
}

function serializeReflection(reflection, currentUserId, {
    commentCount = 0, includeSubmissionMetadata = false, isLiked = false, likeCount = 0,
} = {}) {
    const value = reflection.get({ plain: true });
    const isAnonymous = value.displayMode === 'ANONYMOUS' || !value.displayName;
    const author = isAnonymous ? null : publicAuthor(value.user, value.displayName);
    const serialized = {
        author,
        commentCount,
        id: value.id,
        content: value.content,
        displayName: isAnonymous ? 'Anonymous' : author?.displayName || value.displayName,
        displayMode: value.displayMode,
        isAnonymous,
        isLiked,
        likeCount,
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

function reflectionIncludes({
    includeModerator = false,
    publicAuthor: includePublicAuthor = false,
    publishedOnly = false,
    creatorId = null,
} = {}) {
    const songWhere = publishedOnly
        ? { creatorId: { [Op.ne]: null }, status: 'PUBLISHED' }
        : creatorId
            ? { creatorId }
            : undefined;

    const includes = [{
        model: Song,
        as: 'song',
        attributes: ['id', 'title', 'creatorId', 'status'],
        include: [{
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email'],
            required: false,
        }],
        ...(songWhere ? { required: true, where: songWhere } : {}),
    }];

    if (includeModerator) {
        includes.push({
            model: User,
            as: 'moderator',
            attributes: ['id', 'name', 'role'],
            required: false,
        });

        includes.push({
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'accountStatus'],
            required: false,
        });
    } else if (includePublicAuthor) {
        includes.push({
            model: User,
            as: 'user',
            attributes: ['id', 'name'],
            include: [{
                model: UserProfile,
                as: 'profile',
                attributes: ['avatarUrl', 'displayName'],
                required: false,
            }],
            required: false,
        });
    }

    return includes;
}

async function findReflection(id, {
    creatorId = null, includeModerator = false, includePublicAuthor = false, transaction,
} = {}) {
    if (!UUID_PATTERN.test(id)) return null;

    return Reflection.findByPk(id, {
        include: reflectionIncludes({ creatorId, includeModerator, publicAuthor: includePublicAuthor }),
        transaction,
    });
}

async function findPublicReflection(id) {
    const reflection = await findReflection(id, { includePublicAuthor: true });
    if (!reflection || reflection.status !== 'APPROVED' || reflection.song?.status !== 'PUBLISHED') return null;
    return reflection;
}

function serializeComment(comment, currentUser, reflectionOwnerId) {
    const value = comment.get({ plain: true });
    return {
        author: publicAuthor(value.user),
        canDelete: Boolean(currentUser && (
            currentUser.id === value.userId
            || currentUser.id === reflectionOwnerId
            || currentUser.role === 'ADMIN'
        )),
        content: value.content,
        createdAt: value.createdAt,
        id: value.id,
    };
}

async function discussionState(reflectionIds, currentUserId) {
    if (!reflectionIds.length) return { commentCounts: new Map(), liked: new Set(), likeCounts: new Map() };
    const [commentRows, likeRows, userLikes] = await Promise.all([
        ReflectionComment.findAll({
            attributes: ['reflectionId', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            group: ['reflectionId'], raw: true,
            where: { reflectionId: { [Op.in]: reflectionIds }, status: 'VISIBLE' },
        }),
        ReflectionLike.findAll({
            attributes: ['reflectionId', [Sequelize.fn('COUNT', Sequelize.col('user_id')), 'count']],
            group: ['reflectionId'], raw: true,
            where: { reflectionId: { [Op.in]: reflectionIds } },
        }),
        currentUserId ? ReflectionLike.findAll({
            attributes: ['reflectionId'], raw: true,
            where: { reflectionId: { [Op.in]: reflectionIds }, userId: currentUserId },
        }) : Promise.resolve([]),
    ]);
    return {
        commentCounts: new Map(commentRows.map((row) => [row.reflectionId, Number(row.count)])),
        liked: new Set(userLikes.map((row) => row.reflectionId)),
        likeCounts: new Map(likeRows.map((row) => [row.reflectionId, Number(row.count)])),
    };
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
        const sort = String(req.query.sort || 'latest').toLowerCase();

        if (!PUBLIC_SORTS.has(sort)) {
            return res.status(400).json({ message: 'Sort must be latest, oldest, most_liked, or most_discussed.' });
        }

        if (songId) {
            if (!UUID_PATTERN.test(songId)) return res.status(400).json({ message: 'songId must be a valid published song id.' });
            const publishedSong = await Song.findOne({ where: { creatorId: { [Op.ne]: null }, id: songId, status: 'PUBLISHED' }, attributes: ['id'] });
            if (!publishedSong) return res.status(404).json({ message: 'Published song not found.' });
            where.songId = songId;
        }
        if (search) where.content = { [Op.like]: `%${search}%` };

        const reflections = await Reflection.findAll({
            where,
            include: reflectionIncludes({ publicAuthor: true, publishedOnly: true }),
            order: [['createdAt', sort === 'oldest' ? 'ASC' : 'DESC'], ['id', 'ASC']],
        });

        const state = await discussionState(reflections.map((item) => item.id), req.authUser?.id);
        const serialized = reflections.map((item) => serializeReflection(item, req.authUser?.id, {
            commentCount: state.commentCounts.get(item.id) || 0,
            isLiked: state.liked.has(item.id),
            likeCount: state.likeCounts.get(item.id) || 0,
        }));
        if (sort === 'most_liked' || sort === 'most_discussed') {
            const countKey = sort === 'most_liked' ? 'likeCount' : 'commentCount';
            serialized.sort((left, right) => (
                right[countKey] - left[countKey]
                || new Date(right.createdAt) - new Date(left.createdAt)
                || left.id.localeCompare(right.id)
            ));
        }

        return res.json({
            reflections: serialized,
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

        if (user) await evaluateAndAward(user.id);

        const created = await findReflection(reflection.id);
        return res.status(201).json({
            reflection: serializeReflection(created, user?.id, { includeSubmissionMetadata: true }),
        });
    } catch (error) {
        return next(error);
    }
});

router.get('/:reflectionId/comments', optionalAuth, async (req, res, next) => {
    try {
        const reflection = await findPublicReflection(req.params.reflectionId);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        const comments = await ReflectionComment.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name'],
                include: [{ model: UserProfile, as: 'profile', attributes: ['avatarUrl', 'displayName'], required: false }],
                required: true,
            }],
            order: [['createdAt', 'ASC'], ['id', 'ASC']],
            where: { reflectionId: reflection.id, status: 'VISIBLE' },
        });
        return res.json({
            comments: comments.map((comment) => serializeComment(comment, req.authUserRecord, reflection.userId)),
        });
    } catch (error) { return next(error); }
});

router.post('/:reflectionId/comments', requireAuth, commentRateLimit, async (req, res, next) => {
    try {
        const reflection = await findPublicReflection(req.params.reflectionId);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        const parsed = validateCommentContent(req.body?.content);
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        const created = await ReflectionComment.create({
            content: parsed.content,
            reflectionId: reflection.id,
            status: 'VISIBLE',
            userId: req.authUserRecord.id,
        });
        const comment = await ReflectionComment.findByPk(created.id, {
            include: [{
                model: User,
                as: 'user',
                attributes: ['id', 'name'],
                include: [{ model: UserProfile, as: 'profile', attributes: ['avatarUrl', 'displayName'], required: false }],
            }],
        });
        return res.status(201).json({
            comment: serializeComment(comment, req.authUserRecord, reflection.userId),
            commentCount: await ReflectionComment.count({ where: { reflectionId: reflection.id, status: 'VISIBLE' } }),
        });
    } catch (error) { return next(error); }
});

router.delete('/:reflectionId/comments/:commentId', requireAuth, async (req, res, next) => {
    try {
        if (!UUID_PATTERN.test(req.params.reflectionId) || !UUID_PATTERN.test(req.params.commentId)) {
            return res.status(404).json({ message: 'Comment not found.' });
        }
        const comment = await ReflectionComment.findOne({
            where: { id: req.params.commentId, reflectionId: req.params.reflectionId, status: 'VISIBLE' },
        });
        if (!comment) return res.status(404).json({ message: 'Comment not found.' });
        const reflection = await findReflection(comment.reflectionId);
        if (!reflection) return res.status(404).json({ message: 'Comment not found.' });
        const currentUser = req.authUserRecord;
        const canDelete = currentUser.id === comment.userId
            || currentUser.id === reflection.userId
            || currentUser.role === 'ADMIN';
        if (!canDelete) return res.status(403).json({ message: 'You do not have permission to remove this comment.' });
        await comment.destroy();
        return res.status(204).end();
    } catch (error) { return next(error); }
});

router.post('/:reflectionId/like', requireAuth, async (req, res, next) => {
    try {
        const reflection = await findPublicReflection(req.params.reflectionId);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        await ReflectionLike.findOrCreate({
            defaults: { reflectionId: reflection.id, userId: req.authUserRecord.id },
            where: { reflectionId: reflection.id, userId: req.authUserRecord.id },
        });
        return res.json({
            likeCount: await ReflectionLike.count({ where: { reflectionId: reflection.id } }),
            liked: true,
        });
    } catch (error) { return next(error); }
});

router.delete('/:reflectionId/like', requireAuth, async (req, res, next) => {
    try {
        const reflection = await findPublicReflection(req.params.reflectionId);
        if (!reflection) return res.status(404).json({ message: 'Reflection not found.' });
        await ReflectionLike.destroy({
            where: { reflectionId: reflection.id, userId: req.authUserRecord.id },
        });
        return res.json({
            likeCount: await ReflectionLike.count({ where: { reflectionId: reflection.id } }),
            liked: false,
        });
    } catch (error) { return next(error); }
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

        // Find the reflection without creator-song filtering first.
        // An active creator may still be deleting their own personal reflection
        // from a song owned by another creator.
        const reflection = await findReflection(req.params.id);

        if (!reflection) {
            return res.status(404).json({
                message: 'Reflection not found.',
            });
        }

        const isOwner = reflection.userId === currentUser.id;

        const hasCreatorAccess =
            currentUser.role === 'CREATOR' &&
            currentUser.creatorAccessStatus === 'ACTIVE';

        const canModerateOwnSong =
            hasCreatorAccess &&
            reflection.song?.creatorId === currentUser.id;

        const canModerate =
            currentUser.role === 'ADMIN' ||
            canModerateOwnSong;

        // Hide reflections belonging to another creator's songs.
        // Returning 404 prevents creators from confirming another creator's
        // private resource exists.
        if (
            !isOwner &&
            hasCreatorAccess &&
            !canModerateOwnSong
        ) {
            return res.status(404).json({
                message: 'Reflection not found.'
            });
        }

        // Normal users may only delete their own reflections.
        // Admins and creators moderating their own songs may continue.
        if (!isOwner && !canModerate) {
            return res.status(403).json({
                message: 'You can only delete your own reflections.'
            });
        }

        await sequelize.transaction(async (transaction) => {
            if (canModerate && !isOwner) {
                await ModerationAction.create({
                    actionType: 'REFLECTION_REJECTED',
                    actorId: currentUser.id,
                    songId: reflection.songId,
                    targetId: reflection.id,
                    targetType: 'REFLECTION',
                    targetUserId: reflection.userId,
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
                action:
                    canModerate && !isOwner
                        ? 'REFLECTION_REJECTED'
                        : 'REFLECTION_DELETED',
                actorId: currentUser.id,
                creatorId: reflection.song?.creatorId || null,
                entityId: reflection.id,
                entityType: 'REFLECTION',
                req,
                songId: reflection.songId,
                transaction,
            });
        });

        return res.status(204).end();
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
