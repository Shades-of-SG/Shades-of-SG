const express = require('express');
const { Op } = require('sequelize');
const {
    AnalyticsEvent, AuditLog, CreatorApplication, CreatorApplicationHistory,
    Folder, FolderSongProposal, GameScore, GenerationJob, ModerationAction,
    Reflection, Song, SongFolder, User, UserWarning, sequelize,
} = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();
router.use(requireAdmin);

const ADMIN_APPLICATION_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']);
const FOLDER_STATUSES = new Set(['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED']);
const PLACEMENT_STATUSES = new Set(['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN']);

function paging(query, maximum = 100) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 25, 1), maximum);
    return { limit, offset: (page - 1) * limit, page };
}

function pageResult(rows, count, page, limit) {
    return { pagination: { limit, page, total: count, totalPages: Math.ceil(count / limit) }, rows };
}

function serializeApplication(application) {
    const value = application.get({ plain: true });
    delete value.resumeData;
    return { ...value, hasResume: Boolean(value.resumeFileName) };
}

router.get('/creator-applications', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = { status: { [Op.in]: [...ADMIN_APPLICATION_STATUSES] } };
        if (req.query.status) {
            const status = String(req.query.status).toUpperCase();
            if (!ADMIN_APPLICATION_STATUSES.has(status)) return res.status(400).json({ message: 'Invalid application review status.' });
            where.status = status;
        }
        const search = String(req.query.search || '').trim();
        if (search) {
            const searchOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            where[Op.or] = [
                { '$applicant.name$': { [searchOperator]: `%${search}%` } },
                { '$applicant.email$': { [searchOperator]: `%${search}%` } },
                { motivation: { [searchOperator]: `%${search}%` } },
            ];
        }
        const { count, rows } = await CreatorApplication.findAndCountAll({
            include: [
                { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'role', 'accountStatus'] },
                { model: User, as: 'reviewer', attributes: ['id', 'name'], required: false },
                { model: CreatorApplicationHistory, as: 'history', required: false, include: [{ model: User, as: 'actor', attributes: ['id', 'name'], required: false }] },
            ],
            distinct: true, limit, offset, order: [['createdAt', 'DESC'], [{ model: CreatorApplicationHistory, as: 'history' }, 'createdAt', 'ASC']], subQuery: false, where,
        });
        return res.json({ applications: rows.map(serializeApplication), pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.patch('/creator-applications/:id/status', async (req, res, next) => {
    try {
        const status = String(req.body.status || '').toUpperCase();
        if (!ADMIN_APPLICATION_STATUSES.has(status)) return res.status(400).json({ message: 'Invalid admin application status.' });
        const application = await CreatorApplication.findByPk(req.params.id);
        if (!application) return res.status(404).json({ message: 'Creator application not found.' });
        if (['APPROVED', 'REJECTED', 'WITHDRAWN'].includes(application.status) && application.status !== status) {
            return res.status(409).json({ message: 'A completed application cannot be reopened.' });
        }
        const adminNotes = req.body.adminNotes === undefined ? application.adminNotes : String(req.body.adminNotes || '').trim() || null;
        if (adminNotes && adminNotes.length > 5000) return res.status(400).json({ message: 'Admin notes must be 5000 characters or fewer.' });
        const applicantFeedback = req.body.applicantFeedback === undefined ? application.applicantFeedback : String(req.body.applicantFeedback || '').trim() || null;
        if (applicantFeedback && applicantFeedback.length > 5000) return res.status(400).json({ message: 'Applicant feedback must be 5000 characters or fewer.' });
        if (status === 'REJECTED' && !applicantFeedback) return res.status(400).json({ message: 'Applicant feedback is required when rejecting an application.' });
        const previousStatus = application.status;

        await sequelize.transaction(async (transaction) => {
            await application.update({ adminNotes, applicantFeedback, reviewedAt: new Date(), reviewedBy: req.authUserRecord.id, status }, { transaction });
            await CreatorApplicationHistory.create({
                applicationId: application.id,
                actorId: req.authUserRecord.id,
                fromStatus: previousStatus,
                note: applicantFeedback || adminNotes,
                toStatus: status,
                visibleToApplicant: Boolean(applicantFeedback),
            }, { transaction });
            if (status === 'APPROVED') {
                const [updated] = await User.update({ role: 'CREATOR' }, { where: { id: application.userId, role: 'REGISTERED' }, transaction });
                if (!updated) {
                    const applicant = await User.findByPk(application.userId, { transaction });
                    if (!applicant || applicant.role !== 'CREATOR') throw new Error('Applicant is not eligible for creator conversion.');
                }
            }
            await writeAudit({
                action: `CREATOR_APPLICATION_${status}`, actorId: req.authUserRecord.id,
                creatorId: status === 'APPROVED' ? application.userId : null,
                entityId: application.id, entityType: 'CREATOR_APPLICATION',
                metadata: { applicantId: application.userId }, req, transaction,
            });
        });
        await application.reload({ include: [
            { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'role'] },
            { model: CreatorApplicationHistory, as: 'history', include: [{ model: User, as: 'actor', attributes: ['id', 'name'], required: false }] },
        ] });
        return res.json({ application: serializeApplication(application) });
    } catch (error) { return next(error); }
});

router.get('/creators', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = { role: 'CREATOR' };
        const search = String(req.query.search || '').trim();
        if (search) {
            const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            where[Op.or] = [{ name: { [operator]: `%${search}%` } }, { email: { [operator]: `%${search}%` } }];
        }
        if (req.query.accountStatus) {
            const accountStatus = String(req.query.accountStatus).toUpperCase();
            if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'Invalid account status.' });
            where.accountStatus = accountStatus;
        }
        const { count, rows: creators } = await User.findAndCountAll({
            attributes: ['id', 'name', 'email', 'role', 'accountStatus', 'createdAt'],
            include: [{ model: Song, as: 'songs', attributes: ['id', 'status'], required: false }],
            distinct: true, limit, offset, order: [['createdAt', 'DESC']], subQuery: false, where,
        });
        return res.json({ creators: creators.map((creator) => {
            const value = creator.get({ plain: true });
            const songs = value.songs || [];
            return { ...value, songCount: songs.length, publishedSongCount: songs.filter((song) => song.status === 'PUBLISHED').length, songs: undefined };
        }), pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.get('/songs', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.status) {
            where.status = String(req.query.status).toUpperCase();
            if (!['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'].includes(where.status)) return res.status(400).json({ message: 'Invalid song status.' });
        }
        if (req.query.creatorId) where.creatorId = req.query.creatorId;
        const search = String(req.query.search || '').trim();
        if (search) {
            const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            where[Op.or] = [{ title: { [operator]: `%${search}%` } }, { artist: { [operator]: `%${search}%` } }];
        }
        const { count, rows } = await Song.findAndCountAll({
            where, limit, offset,
            include: [
                { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'accountStatus'] },
                { model: Folder, as: 'folders', attributes: ['id', 'name', 'status'], through: { attributes: ['songOrder'] }, required: false },
            ],
            distinct: true, order: [['updatedAt', 'DESC']], subQuery: false,
        });
        return res.json({ pagination: pageResult([], count, page, limit).pagination, songs: rows });
    } catch (error) { return next(error); }
});

router.patch('/creators/:id/status', async (req, res, next) => {
    try {
        const accountStatus = String(req.body.accountStatus || '').toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'accountStatus must be ACTIVE or SUSPENDED.' });
        const creator = await User.findOne({ where: { id: req.params.id, role: 'CREATOR' } });
        if (!creator) return res.status(404).json({ message: 'Creator not found.' });
        await creator.update({ accountStatus });
        await writeAudit({ action: `CREATOR_${accountStatus}`, actorId: req.authUserRecord.id, creatorId: creator.id, entityId: creator.id, entityType: 'USER', req });
        return res.json({ creator });
    } catch (error) { return next(error); }
});

router.patch('/users/:id/status', async (req, res, next) => {
    try {
        const accountStatus = String(req.body.accountStatus || '').toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'accountStatus must be ACTIVE or SUSPENDED.' });
        const user = await User.findOne({ where: { id: req.params.id, role: { [Op.in]: ['REGISTERED', 'CREATOR'] } } });
        if (!user) return res.status(404).json({ message: 'Manageable user not found.' });
        await user.update({ accountStatus });
        await ModerationAction.create({ actionType: `USER_${accountStatus}`, actorId: req.authUserRecord.id, targetId: user.id, targetType: 'USER', targetUserId: user.id });
        await writeAudit({ action: `USER_${accountStatus}`, actorId: req.authUserRecord.id, creatorId: user.role === 'CREATOR' ? user.id : null, entityId: user.id, entityType: 'USER', req });
        return res.json({ user });
    } catch (error) { return next(error); }
});

router.get('/folders', async (req, res, next) => {
    try {
        const where = req.query.status ? { status: String(req.query.status).toUpperCase() } : {};
        if (where.status && !FOLDER_STATUSES.has(where.status)) return res.status(400).json({ message: 'Invalid folder status.' });
        const { limit, offset, page } = paging(req.query);
        if (req.query.origin) where.origin = String(req.query.origin).toUpperCase();
        const search = String(req.query.search || '').trim();
        if (search) where.name = { [sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like]: `%${search}%` };
        const { count, rows } = await Folder.findAndCountAll({
            include: [
                { model: User, as: 'proposer', attributes: ['id', 'name', 'email'], required: false },
                { model: Song, as: 'songs', attributes: ['id', 'title', 'status'], through: { attributes: ['songOrder'] }, required: false },
            ],
            distinct: true, limit, offset, order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']], subQuery: false, where,
        });
        return res.json({ folders: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.post('/folders', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const slug = String(req.body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (name.length < 2 || name.length > 255 || !slug) return res.status(400).json({ message: 'A valid folder name is required.' });
        const displayOrder = Number(req.body.displayOrder || 0);
        if (!Number.isInteger(displayOrder) || displayOrder < 0) return res.status(400).json({ message: 'displayOrder must be a non-negative integer.' });
        const folder = await Folder.create({ createdBy: req.authUserRecord.id, description: String(req.body.description || '').trim() || null, displayOrder, name, origin: 'PLATFORM', slug, status: 'APPROVED' });
        await writeAudit({ action: 'PLATFORM_FOLDER_CREATED', actorId: req.authUserRecord.id, entityId: folder.id, entityType: 'FOLDER', req });
        return res.status(201).json({ folder });
    } catch (error) { return next(error); }
});

router.patch('/folders/:id', async (req, res, next) => {
    try {
        const folder = await Folder.findByPk(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found.' });
        const updates = {};
        if (req.body.status !== undefined) {
            updates.status = String(req.body.status).toUpperCase();
            if (!FOLDER_STATUSES.has(updates.status)) return res.status(400).json({ message: 'Invalid folder status.' });
            updates.reviewedAt = new Date();
            updates.reviewedBy = req.authUserRecord.id;
        }
        if (req.body.name !== undefined) {
            updates.name = String(req.body.name).trim();
            if (updates.name.length < 2 || updates.name.length > 255) return res.status(400).json({ message: 'Folder name must be between 2 and 255 characters.' });
        }
        if (req.body.description !== undefined) updates.description = String(req.body.description || '').trim() || null;
        if (req.body.reviewNote !== undefined) updates.reviewNote = String(req.body.reviewNote || '').trim() || null;
        if (req.body.displayOrder !== undefined) {
            updates.displayOrder = Number(req.body.displayOrder);
            if (!Number.isInteger(updates.displayOrder) || updates.displayOrder < 0) return res.status(400).json({ message: 'displayOrder must be a non-negative integer.' });
        }
        await folder.update(updates);
        await writeAudit({ action: `FOLDER_${updates.status || 'UPDATED'}`, actorId: req.authUserRecord.id, creatorId: folder.proposedBy, entityId: folder.id, entityType: 'FOLDER', req });
        return res.json({ folder });
    } catch (error) { return next(error); }
});

router.get('/folder-song-proposals', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.status) {
            where.status = String(req.query.status).toUpperCase();
            if (!PLACEMENT_STATUSES.has(where.status)) return res.status(400).json({ message: 'Invalid placement proposal status.' });
        }
        const { count, rows } = await FolderSongProposal.findAndCountAll({
            where, limit, offset, distinct: true, order: [['createdAt', 'DESC']],
            include: [
                { model: Song, as: 'song', attributes: ['id', 'title', 'status', 'creatorId'], include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }] },
                { model: Folder, as: 'folder', attributes: ['id', 'name', 'status'] },
                { model: User, as: 'proposer', attributes: ['id', 'name', 'email'] },
            ],
        });
        return res.json({ pagination: pageResult([], count, page, limit).pagination, proposals: rows });
    } catch (error) { return next(error); }
});

router.patch('/folder-song-proposals/:id', async (req, res, next) => {
    try {
        const status = String(req.body.status || '').toUpperCase();
        if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status)) return res.status(400).json({ message: 'Status must be APPROVED, REJECTED, or CHANGES_REQUESTED.' });
        const reviewNote = String(req.body.reviewNote || '').trim() || null;
        if (status !== 'APPROVED' && !reviewNote) return res.status(400).json({ message: 'A review note is required.' });
        const proposal = await FolderSongProposal.findByPk(req.params.id, { include: [{ model: Song, as: 'song', attributes: ['id', 'creatorId'] }, { model: Folder, as: 'folder', attributes: ['id', 'status'] }] });
        if (!proposal) return res.status(404).json({ message: 'Placement proposal not found.' });
        if (!['PENDING', 'CHANGES_REQUESTED'].includes(proposal.status)) return res.status(409).json({ message: 'This placement proposal is already complete.' });
        if (status === 'APPROVED' && proposal.folder.status !== 'APPROVED') return res.status(409).json({ message: 'Only approved folders can receive songs.' });
        const songOrder = Number(req.body.songOrder || 0);
        if (!Number.isInteger(songOrder) || songOrder < 0) return res.status(400).json({ message: 'songOrder must be a non-negative integer.' });
        await sequelize.transaction(async (transaction) => {
            await proposal.update({ reviewNote, reviewedAt: new Date(), reviewedBy: req.authUserRecord.id, status }, { transaction });
            if (status === 'APPROVED') {
                const [link] = await SongFolder.findOrCreate({ defaults: { addedBy: req.authUserRecord.id, songOrder }, where: { folderId: proposal.folderId, songId: proposal.songId }, transaction });
                if (link.songOrder !== songOrder) await link.update({ songOrder }, { transaction });
            }
            await writeAudit({ action: `SONG_FOLDER_PROPOSAL_${status}`, actorId: req.authUserRecord.id, creatorId: proposal.song.creatorId, entityId: proposal.id, entityType: 'FOLDER_SONG_PROPOSAL', metadata: { folderId: proposal.folderId }, req, songId: proposal.songId, transaction });
        });
        return res.json({ proposal });
    } catch (error) { return next(error); }
});

router.put('/folders/:folderId/songs/:songId', async (req, res, next) => {
    try {
        const [folder, song] = await Promise.all([
            Folder.findOne({ where: { id: req.params.folderId, status: 'APPROVED' } }),
            Song.findByPk(req.params.songId),
        ]);
        if (!folder || !song) return res.status(404).json({ message: 'Approved folder or song not found.' });
        const songOrder = Number(req.body.songOrder || 0);
        if (!Number.isInteger(songOrder) || songOrder < 0) return res.status(400).json({ message: 'songOrder must be a non-negative integer.' });
        const [link, created] = await SongFolder.findOrCreate({ defaults: { addedBy: req.authUserRecord.id, songOrder }, where: { folderId: folder.id, songId: song.id } });
        if (!created) await link.update({ addedBy: req.authUserRecord.id, songOrder });
        await writeAudit({ action: 'ADMIN_SONG_FOLDER_ASSIGNED', actorId: req.authUserRecord.id, creatorId: song.creatorId, entityId: folder.id, entityType: 'FOLDER', req, songId: song.id });
        return res.status(created ? 201 : 200).json({ link });
    } catch (error) { return next(error); }
});

router.delete('/folders/:folderId/songs/:songId', async (req, res, next) => {
    try {
        const song = await Song.findByPk(req.params.songId);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        const deleted = await SongFolder.destroy({ where: { folderId: req.params.folderId, songId: song.id } });
        if (!deleted) return res.status(404).json({ message: 'Song folder link not found.' });
        await writeAudit({ action: 'ADMIN_SONG_FOLDER_REMOVED', actorId: req.authUserRecord.id, creatorId: song.creatorId, entityId: req.params.folderId, entityType: 'FOLDER', req, songId: song.id });
        return res.status(204).end();
    } catch (error) { return next(error); }
});

router.get('/analytics', async (req, res, next) => {
    try {
        const [admins, creators, registeredUsers, songs, publishedSongs, scores, reflections, generationJobs, eventRows] = await Promise.all([
            User.count({ where: { role: 'ADMIN' } }), User.count({ where: { role: 'CREATOR' } }),
            User.count({ where: { role: 'REGISTERED' } }), Song.count(), Song.count({ where: { status: 'PUBLISHED' } }),
            GameScore.count(), Reflection.count(), GenerationJob.count(), AnalyticsEvent.count({ group: ['eventType'] }),
        ]);
        const events = Object.fromEntries(eventRows.map((row) => [row.eventType, Number(row.count)]));
        return res.json({ events, generationJobs, reflections, scores, songs: { published: publishedSongs, total: songs }, users: { admins, creators, registered: registeredUsers, total: admins + creators + registeredUsers } });
    } catch (error) { return next(error); }
});

router.get('/warnings', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = req.query.userId ? { userId: req.query.userId } : {};
        if (req.query.status) {
            const status = String(req.query.status).toUpperCase();
            if (!['ACTIVE', 'RESOLVED'].includes(status)) return res.status(400).json({ message: 'Invalid warning status.' });
            where.status = status;
        }
        const search = String(req.query.search || '').trim();
        if (search) where.reason = { [sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like]: `%${search}%` };
        const { count, rows } = await UserWarning.findAndCountAll({
            include: [
                { model: User, as: 'warnedUser', attributes: ['id', 'name', 'email', 'role', 'accountStatus'] },
                { model: User, as: 'issuer', attributes: ['id', 'name'] },
            ], limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ warnings: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.post('/warnings', async (req, res, next) => {
    try {
        const reason = String(req.body.reason || '').trim();
        if (reason.length < 5 || reason.length > 2000) return res.status(400).json({ message: 'Warning reason must be between 5 and 2000 characters.' });
        const target = await User.findByPk(req.body.userId, { attributes: ['id'] });
        if (!target) return res.status(404).json({ message: 'User not found.' });
        const warning = await UserWarning.create({ issuedBy: req.authUserRecord.id, reason, userId: target.id });
        await ModerationAction.create({ actionType: 'USER_WARNED', actorId: req.authUserRecord.id, reason, targetId: target.id, targetType: 'USER', targetUserId: target.id });
        await writeAudit({ action: 'USER_WARNED', actorId: req.authUserRecord.id, entityId: warning.id, entityType: 'USER_WARNING', metadata: { targetUserId: target.id }, req });
        return res.status(201).json({ warning });
    } catch (error) { return next(error); }
});

router.patch('/warnings/:id/resolve', async (req, res, next) => {
    try {
        const warning = await UserWarning.findByPk(req.params.id);
        if (!warning) return res.status(404).json({ message: 'Warning not found.' });
        if (warning.status === 'RESOLVED') return res.json({ warning });
        await warning.update({ resolutionNote: String(req.body.resolutionNote || '').trim() || null, resolvedAt: new Date(), resolvedBy: req.authUserRecord.id, status: 'RESOLVED' });
        await ModerationAction.create({ actionType: 'USER_WARNING_RESOLVED', actorId: req.authUserRecord.id, targetId: warning.id, targetType: 'USER_WARNING', targetUserId: warning.userId });
        await writeAudit({ action: 'USER_WARNING_RESOLVED', actorId: req.authUserRecord.id, entityId: warning.id, entityType: 'USER_WARNING', req });
        return res.json({ warning });
    } catch (error) { return next(error); }
});

router.get('/moderation-actions', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.actionType) where.actionType = String(req.query.actionType);
        if (req.query.targetType) where.targetType = String(req.query.targetType);
        if (req.query.actorId) where.actorId = req.query.actorId;
        const { count, rows } = await ModerationAction.findAndCountAll({
            include: [
                { model: User, as: 'actor', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'targetUser', attributes: ['id', 'name', 'email'], required: false },
                { model: Song, as: 'song', attributes: ['id', 'title'], required: false },
            ],
            limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ actions: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.get('/audit-logs', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = req.query.actorId ? { actorId: req.query.actorId } : {};
        if (req.query.action) where.action = { [Op.eq]: String(req.query.action) };
        if (req.query.entityType) where.entityType = String(req.query.entityType);
        if (req.query.songId) where.songId = req.query.songId;
        const { count, rows } = await AuditLog.findAndCountAll({
            include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'email'], required: false }],
            limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ auditLogs: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

module.exports = router;
