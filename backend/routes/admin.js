const express = require('express');
const { Op } = require('sequelize');
const {
    AuditLog, CreatorApplication, Folder, GameScore, GenerationJob,
    ModerationAction, Reflection, Song, User, UserWarning, sequelize,
} = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();
router.use(requireAdmin);

const APPLICATION_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']);
const FOLDER_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED']);

function paging(query, maximum = 100) {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 25, 1), maximum);
    return { limit, offset: (page - 1) * limit, page };
}

function pageResult(rows, count, page, limit) {
    return { pagination: { limit, page, total: count, totalPages: Math.ceil(count / limit) }, rows };
}

router.get('/creator-applications', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.status) {
            const status = String(req.query.status).toUpperCase();
            if (!APPLICATION_STATUSES.has(status)) return res.status(400).json({ message: 'Invalid application status.' });
            where.status = status;
        }
        const { count, rows } = await CreatorApplication.findAndCountAll({
            include: [
                { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'role', 'accountStatus'] },
                { model: User, as: 'reviewer', attributes: ['id', 'name'], required: false },
            ],
            limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ applications: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.patch('/creator-applications/:id/status', async (req, res, next) => {
    try {
        const status = String(req.body.status || '').toUpperCase();
        if (!APPLICATION_STATUSES.has(status)) return res.status(400).json({ message: 'Invalid application status.' });
        const application = await CreatorApplication.findByPk(req.params.id);
        if (!application) return res.status(404).json({ message: 'Creator application not found.' });
        if (['APPROVED', 'REJECTED'].includes(application.status) && application.status !== status) {
            return res.status(409).json({ message: 'A completed application cannot be reopened.' });
        }
        const adminNotes = req.body.adminNotes === undefined ? application.adminNotes : String(req.body.adminNotes || '').trim() || null;
        if (adminNotes && adminNotes.length > 5000) return res.status(400).json({ message: 'Admin notes must be 5000 characters or fewer.' });

        await sequelize.transaction(async (transaction) => {
            await application.update({ adminNotes, reviewedAt: new Date(), reviewedBy: req.authUserRecord.id, status }, { transaction });
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
        await application.reload({ include: [{ model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'role'] }] });
        return res.json({ application });
    } catch (error) { return next(error); }
});

router.get('/creators', async (req, res, next) => {
    try {
        const creators = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'accountStatus', 'createdAt'],
            include: [{ model: Song, as: 'songs', attributes: ['id', 'status'], required: false }],
            order: [['createdAt', 'DESC']], where: { role: 'CREATOR' },
        });
        return res.json({ creators: creators.map((creator) => {
            const value = creator.get({ plain: true });
            const songs = value.songs || [];
            return { ...value, songCount: songs.length, publishedSongCount: songs.filter((song) => song.status === 'PUBLISHED').length, songs: undefined };
        }) });
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

router.get('/folders', async (req, res, next) => {
    try {
        const where = req.query.status ? { status: String(req.query.status).toUpperCase() } : {};
        if (where.status && !FOLDER_STATUSES.has(where.status)) return res.status(400).json({ message: 'Invalid folder status.' });
        const folders = await Folder.findAll({
            include: [{ model: User, as: 'proposer', attributes: ['id', 'name', 'email'], required: false }],
            order: [['createdAt', 'DESC']], where,
        });
        return res.json({ folders });
    } catch (error) { return next(error); }
});

router.post('/folders', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const slug = String(req.body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (name.length < 2 || name.length > 255 || !slug) return res.status(400).json({ message: 'A valid folder name is required.' });
        const folder = await Folder.create({ createdBy: req.authUserRecord.id, description: String(req.body.description || '').trim() || null, name, origin: 'PLATFORM', slug, status: 'APPROVED' });
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
        await folder.update(updates);
        await writeAudit({ action: `FOLDER_${updates.status || 'UPDATED'}`, actorId: req.authUserRecord.id, creatorId: folder.proposedBy, entityId: folder.id, entityType: 'FOLDER', req });
        return res.json({ folder });
    } catch (error) { return next(error); }
});

router.get('/analytics', async (req, res, next) => {
    try {
        const [admins, creators, registeredUsers, songs, publishedSongs, scores, reflections, generationJobs] = await Promise.all([
            User.count({ where: { role: 'ADMIN' } }), User.count({ where: { role: 'CREATOR' } }),
            User.count({ where: { role: 'REGISTERED' } }), Song.count(), Song.count({ where: { status: 'PUBLISHED' } }),
            GameScore.count(), Reflection.count(), GenerationJob.count(),
        ]);
        return res.json({ generationJobs, reflections, scores, songs: { published: publishedSongs, total: songs }, users: { admins, creators, registered: registeredUsers, total: admins + creators + registeredUsers } });
    } catch (error) { return next(error); }
});

router.get('/warnings', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = req.query.userId ? { userId: req.query.userId } : {};
        const { count, rows } = await UserWarning.findAndCountAll({
            include: [
                { model: User, as: 'warnedUser', attributes: ['id', 'name', 'email'] },
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
        const { count, rows } = await ModerationAction.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']] });
        return res.json({ actions: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.get('/audit-logs', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = req.query.actorId ? { actorId: req.query.actorId } : {};
        if (req.query.action) where.action = { [Op.eq]: String(req.query.action) };
        const { count, rows } = await AuditLog.findAndCountAll({ limit, offset, order: [['createdAt', 'DESC']], where });
        return res.json({ auditLogs: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

module.exports = router;
