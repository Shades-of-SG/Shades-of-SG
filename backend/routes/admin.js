const express = require('express');
const { Op } = require('sequelize');
const {
    AnalyticsEvent, AuditLog, CreatorApplication, CreatorApplicationHistory,
    Folder, FolderSongProposal, GameScore, GenerationJob, ModerationAction,
    Reflection, Song, SongFolder, User, UserWarning, sequelize,
} = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');
const { sendApplicationEmail } = require('../services/emailService');

const router = express.Router();
router.use(requireAdmin);

const ADMIN_APPLICATION_STATUSES = new Set(['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED']);
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
    delete value.resumeUrl;
    return { ...value, hasResume: Boolean(value.resumeFileName) };
}

function serializeManagedUser(user) {
    const value = user.get({ plain: true });
    delete value.passwordHash;
    delete value.authVersion;
    return value;
}

function accessReason(value, maximum = 1000) {
    const reason = String(value || '').trim() || null;
    return reason && reason.length > maximum ? undefined : reason;
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
                { introduction: { [searchOperator]: `%${search}%` } },
                { motivation: { [searchOperator]: `%${search}%` } },
                { contentIdeas: { [searchOperator]: `%${search}%` } },
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
        if (['CHANGES_REQUESTED', 'REJECTED'].includes(status) && !applicantFeedback) return res.status(400).json({ message: 'Applicant feedback is required for this status.' });
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
                const [updated] = await User.update({ creatorAccessStatus: 'ACTIVE', creatorSuspensionReason: null, role: 'CREATOR' }, { where: { id: application.userId, role: 'REGISTERED' }, transaction });
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
        try {
            const applicant = await User.findByPk(application.userId, { attributes: ['email', 'name'] });
            if (applicant) await sendApplicationEmail({ feedback: applicantFeedback, name: applicant.name, status, to: applicant.email });
        } catch (error) {
            console.error('[Creator application email]', error.message);
        }
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
        const creatorAccessFilter = req.query.creatorAccessStatus || req.query.accountStatus;
        if (creatorAccessFilter) {
            const creatorAccessStatus = String(creatorAccessFilter).toUpperCase();
            if (!['ACTIVE', 'SUSPENDED'].includes(creatorAccessStatus)) return res.status(400).json({ message: 'Invalid creator access status.' });
            where.creatorAccessStatus = creatorAccessStatus;
        }
        if (req.query.userAccountStatus) {
            const accountStatus = String(req.query.userAccountStatus).toUpperCase();
            if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'Invalid user account status.' });
            where.accountStatus = accountStatus;
        }
        const { count, rows: creators } = await User.findAndCountAll({
            attributes: [
                'id', 'name', 'email', 'role', 'accountStatus', 'accountSuspensionReason',
                'creatorAccessStatus', 'creatorSuspensionReason', 'createdAt', 'updatedAt',
            ],
            include: [
                { model: Song, as: 'songs', attributes: ['id', 'status'], required: false, separate: true },
                {
                    model: CreatorApplication, as: 'creatorApplications', required: false, separate: true,
                    attributes: ['id', 'status', 'createdAt', 'reviewedAt'],
                    include: [{ model: CreatorApplicationHistory, as: 'history', attributes: ['id', 'fromStatus', 'toStatus', 'note', 'createdAt'], required: false }],
                },
                {
                    model: UserWarning, as: 'warnings', required: false, separate: true,
                    attributes: ['id', 'reason', 'status', 'createdAt', 'resolvedAt'],
                    include: [{ model: User, as: 'issuer', attributes: ['id', 'name'], required: false }],
                },
            ],
            distinct: true, limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ creators: creators.map((creator) => {
            const value = creator.get({ plain: true });
            const songs = value.songs || [];
            return { ...value, songCount: songs.length, publishedSongCount: songs.filter((song) => song.status === 'PUBLISHED').length, songs: undefined };
        }), pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.get('/users', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = { role: { [Op.in]: ['REGISTERED', 'CREATOR'] } };
        const conditions = [];
        const search = String(req.query.search || '').trim();
        if (search) {
            const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            conditions.push({ [Op.or]: [{ name: { [operator]: `%${search}%` } }, { email: { [operator]: `%${search}%` } }] });
        }
        if (req.query.role) {
            const role = String(req.query.role).toUpperCase();
            if (!['REGISTERED', 'CREATOR'].includes(role)) return res.status(400).json({ message: 'Invalid user role.' });
            where.role = role;
        }
        if (req.query.accountStatus) {
            const accountStatus = String(req.query.accountStatus).toUpperCase();
            if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'Invalid account status.' });
            where.accountStatus = accountStatus;
        }
        if (req.query.scope) {
            if (String(req.query.scope).toLowerCase() !== 'safety') return res.status(400).json({ message: 'Invalid user scope.' });
            const [warningRows, flaggedRows, actionRows] = await Promise.all([
                UserWarning.findAll({ attributes: ['userId'], group: ['userId'], raw: true }),
                Reflection.findAll({ attributes: ['userId'], group: ['userId'], raw: true, where: { status: 'FLAGGED', userId: { [Op.ne]: null } } }),
                ModerationAction.findAll({ attributes: ['targetUserId'], group: ['targetUserId'], raw: true, where: { targetUserId: { [Op.ne]: null } } }),
            ]);
            const safetyUserIds = [...new Set([
                ...warningRows.map((row) => row.userId),
                ...flaggedRows.map((row) => row.userId),
                ...actionRows.map((row) => row.targetUserId),
            ].filter(Boolean))];
            conditions.push({ [Op.or]: [{ accountStatus: 'SUSPENDED' }, { id: { [Op.in]: safetyUserIds } }] });
        }
        if (conditions.length) where[Op.and] = conditions;
        const { count, rows } = await User.findAndCountAll({
            attributes: [
                'id', 'name', 'email', 'role', 'accountStatus', 'accountSuspensionReason',
                'creatorAccessStatus', 'creatorSuspensionReason', 'createdAt', 'updatedAt',
            ],
            include: [
                { model: Reflection, as: 'reflections', attributes: ['id', 'status'], required: false },
                { model: UserWarning, as: 'warnings', attributes: ['id', 'status'], required: false },
            ],
            distinct: true, limit, offset, order: [['createdAt', 'DESC']], subQuery: false, where,
        });
        return res.json({
            pagination: pageResult([], count, page, limit).pagination,
            users: rows.map((user) => {
                const value = user.get({ plain: true });
                const reflections = value.reflections || [];
                const warnings = value.warnings || [];
                return {
                    ...value,
                    activeWarningCount: warnings.filter((warning) => warning.status === 'ACTIVE').length,
                    flaggedContentCount: reflections.filter((reflection) => reflection.status === 'FLAGGED').length,
                    reflectionCount: reflections.length,
                    warningCount: warnings.length,
                    reflections: undefined,
                    warnings: undefined,
                };
            }),
        });
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

router.post('/songs/:id/unpublish', async (req, res, next) => {
    try {
        const reason = accessReason(req.body.reason, 2000);
        if (reason === undefined) return res.status(400).json({ message: 'Unpublish reason must be 2000 characters or fewer.' });
        if (!reason) return res.status(400).json({ message: 'A reason is required to unpublish a song.' });
        const song = await Song.findByPk(req.params.id);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status !== 'PUBLISHED') return res.status(409).json({ message: 'Only a published song can be unpublished.' });
        await sequelize.transaction(async (transaction) => {
            await song.update({ status: 'READY' }, { transaction });
            await writeAudit({
                action: 'SONG_UNPUBLISHED_BY_ADMIN', actorId: req.authUserRecord.id, creatorId: song.creatorId,
                entityId: song.id, entityType: 'SONG', metadata: { reason }, req, songId: song.id, transaction,
            });
        });
        return res.json({ song });
    } catch (error) { return next(error); }
});

router.patch('/creators/:id/status', async (req, res, next) => {
    try {
        // accountStatus remains an accepted alias for older admin clients, but
        // this creator-specific endpoint no longer changes whole-account access.
        const creatorAccessStatus = String(req.body.creatorAccessStatus || req.body.accountStatus || '').toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(creatorAccessStatus)) return res.status(400).json({ message: 'creatorAccessStatus must be ACTIVE or SUSPENDED.' });
        const reason = accessReason(req.body.reason);
        if (reason === undefined) return res.status(400).json({ message: 'Creator suspension reason must be 1000 characters or fewer.' });
        const creator = await User.findOne({ where: { id: req.params.id, role: 'CREATOR' } });
        if (!creator) return res.status(404).json({ message: 'Creator not found.' });
        const nextReason = creatorAccessStatus === 'SUSPENDED'
            ? reason || creator.creatorSuspensionReason || 'Contact Shades of SG support for details or to appeal this decision.'
            : null;
        const action = creatorAccessStatus === 'SUSPENDED' ? 'CREATOR_SUSPENDED' : 'CREATOR_RESTORED';
        await sequelize.transaction(async (transaction) => {
            await creator.update({ creatorAccessStatus, creatorSuspensionReason: nextReason }, { transaction });
            await writeAudit({
                action, actorId: req.authUserRecord.id, creatorId: creator.id, entityId: creator.id,
                entityType: 'USER', metadata: { accountStatus: creator.accountStatus, creatorAccessStatus, reason: nextReason }, req, transaction,
            });
        });
        return res.json({ creator: serializeManagedUser(creator) });
    } catch (error) { return next(error); }
});

router.patch('/users/:id/status', async (req, res, next) => {
    try {
        const accountStatus = String(req.body.accountStatus || '').toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'accountStatus must be ACTIVE or SUSPENDED.' });
        const reason = accessReason(req.body.reason);
        if (reason === undefined) return res.status(400).json({ message: 'Account suspension reason must be 1000 characters or fewer.' });
        const user = await User.findOne({ where: { id: req.params.id, role: { [Op.in]: ['REGISTERED', 'CREATOR'] } } });
        if (!user) return res.status(404).json({ message: 'Manageable user not found.' });
        const nextReason = accountStatus === 'SUSPENDED'
            ? reason || user.accountSuspensionReason || 'Contact Shades of SG support for details or to appeal this decision.'
            : null;
        const auditAction = accountStatus === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESTORED';
        await sequelize.transaction(async (transaction) => {
            await user.update({ accountStatus, accountSuspensionReason: nextReason }, { transaction });
            await ModerationAction.create({
                actionType: `USER_${accountStatus}`, actorId: req.authUserRecord.id, reason: nextReason,
                targetId: user.id, targetType: 'USER', targetUserId: user.id,
            }, { transaction });
            await writeAudit({
                action: auditAction, actorId: req.authUserRecord.id, creatorId: user.role === 'CREATOR' ? user.id : null,
                entityId: user.id, entityType: 'USER', metadata: { accountStatus, creatorAccessStatus: user.creatorAccessStatus, reason: nextReason }, req, transaction,
            });
        });
        return res.json({ user: serializeManagedUser(user) });
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
        const singaporeNow = new Date(Date.now() + (8 * 60 * 60 * 1000));
        const activityStart = new Date(Date.UTC(singaporeNow.getUTCFullYear(), singaporeNow.getUTCMonth(), singaporeNow.getUTCDate() - 6) - (8 * 60 * 60 * 1000));
        const [admins, creators, registeredUsers, songs, publishedSongs, scores, reflections, generationJobs, eventRows, pendingApplications, pendingReflections, flaggedReflections, unresolvedWarnings, suspendedAccounts, recentEvents] = await Promise.all([
            User.count({ where: { role: 'ADMIN' } }), User.count({ where: { role: 'CREATOR' } }),
            User.count({ where: { role: 'REGISTERED' } }), Song.count(), Song.count({ where: { status: 'PUBLISHED' } }),
            GameScore.count(), Reflection.count(), GenerationJob.count(), AnalyticsEvent.count({ group: ['eventType'] }),
            CreatorApplication.count({ where: { status: { [Op.in]: ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW'] } } }),
            Reflection.count({ where: { status: 'PENDING' } }), Reflection.count({ where: { status: 'FLAGGED' } }),
            UserWarning.count({ where: { status: 'ACTIVE' } }), User.count({ where: { accountStatus: 'SUSPENDED', role: { [Op.in]: ['REGISTERED', 'CREATOR'] } } }),
            AnalyticsEvent.findAll({
                attributes: ['eventType', 'createdAt'], raw: true,
                where: { createdAt: { [Op.gte]: activityStart }, eventType: { [Op.in]: ['SONG_PAGE_VIEWED', 'SONG_PLAYBACK_STARTED'] } },
            }),
        ]);
        const events = Object.fromEntries(eventRows.map((row) => [row.eventType, Number(row.count)]));
        const activityByDate = new Map();
        for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
            const date = new Date(Date.UTC(singaporeNow.getUTCFullYear(), singaporeNow.getUTCMonth(), singaporeNow.getUTCDate() - daysAgo));
            const key = date.toISOString().slice(0, 10);
            activityByDate.set(key, {
                date: key,
                label: date.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', timeZone: 'UTC' }),
                playbacks: 0,
                views: 0,
            });
        }
        recentEvents.forEach((event) => {
            const key = new Date(new Date(event.createdAt).getTime() + (8 * 60 * 60 * 1000)).toISOString().slice(0, 10);
            const point = activityByDate.get(key);
            if (!point) return;
            if (event.eventType === 'SONG_PAGE_VIEWED') point.views += 1;
            if (event.eventType === 'SONG_PLAYBACK_STARTED') point.playbacks += 1;
        });
        return res.json({
            activitySeries: [...activityByDate.values()], events, generationJobs, reflections, scores,
            pending: { creatorApplications: pendingApplications, flaggedReflections, reflections: pendingReflections, suspendedAccounts, unresolvedWarnings },
            songs: { published: publishedSongs, total: songs },
            users: { admins, creators, registered: registeredUsers, total: admins + creators + registeredUsers },
        });
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
        if (req.query.scope) {
            if (String(req.query.scope).toLowerCase() !== 'account') return res.status(400).json({ message: 'Invalid moderation action scope.' });
            where.actionType = { [Op.in]: ['USER_SUSPENDED', 'USER_ACTIVE'] };
        }
        const { count, rows } = await ModerationAction.findAndCountAll({
            include: [
                { model: User, as: 'actor', attributes: ['id', 'name', 'email', 'role'] },
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
        if (req.query.entityId) where.entityId = String(req.query.entityId);
        if (req.query.entityType) where.entityType = String(req.query.entityType);
        if (req.query.songId) where.songId = req.query.songId;
        const { count, rows } = await AuditLog.findAndCountAll({
            include: [
                { model: User, as: 'actor', attributes: ['id', 'name', 'email', 'role'], required: false },
                { model: User, as: 'creator', attributes: ['id', 'name', 'email'], required: false },
                { model: Song, as: 'song', attributes: ['id', 'title'], required: false },
            ],
            limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ auditLogs: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

module.exports = router;
