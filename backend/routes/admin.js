const express = require('express');
const { Op, QueryTypes } = require('sequelize');
const {
    AnalyticsEvent, AuditLog, CreatorApplication, CreatorApplicationHistory,
    Folder, FolderSongProposal, GameScore, GenerationJob, ModerationAction, ModerationFlag,
    Reflection, ReflectionComment, Song, SongFolder, User, UserWarning, sequelize,
} = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { isUuid, validateUuidParam } = require('../middleware/validateUuid');
const { writeAudit } = require('../services/auditService');
const { sendApplicationEmail } = require('../services/emailService');
const { getSongPublishMissing } = require('../services/songPublishingService');
const { createInProductNotification } = require('../services/notificationService');

const router = express.Router();
router.use(requireAdmin);

const ADMIN_APPLICATION_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED'];
const ADMIN_APPLICATION_STATUS_SET = new Set(ADMIN_APPLICATION_STATUSES);
const ADMIN_APPLICATION_TRANSITIONS = {
    SUBMITTED: ['UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED'],
    UNDER_REVIEW: ['CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED'],
    CHANGES_REQUESTED: ['REJECTED'],
    SHORTLISTED: ['CHANGES_REQUESTED', 'INTERVIEW', 'APPROVED', 'REJECTED'],
    INTERVIEW: ['CHANGES_REQUESTED', 'APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: [],
};
const SONG_STATUSES = ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'];
const SONG_STATUS_SET = new Set(SONG_STATUSES);
const FOLDER_STATUSES = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED'];
const FOLDER_STATUS_SET = new Set(FOLDER_STATUSES);
const FOLDER_ORIGINS = ['PLATFORM', 'CREATOR_PROPOSAL'];
const FOLDER_ORIGIN_SET = new Set(FOLDER_ORIGINS);
const PLACEMENT_STATUSES = ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'];
const PLACEMENT_STATUS_SET = new Set(PLACEMENT_STATUSES);
const PLACEMENT_TRANSITIONS = {
    PENDING: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
    CHANGES_REQUESTED: ['REJECTED'],
    APPROVED: [],
    REJECTED: [],
    WITHDRAWN: [],
};
const SAFETY_ACTION_TYPES = [
    'CREATOR_RESTORED', 'CREATOR_SUSPENDED', 'REFLECTION_COMMENT_REMOVED',
    'REFLECTION_COMMENT_RESTORED', 'REFLECTION_FLAGGED',
    'REFLECTION_REMOVED_BY_ADMIN', 'SAFETY_REPORT_DISMISSED',
    'SAFETY_REPORT_RETURNED_TO_CREATOR', 'SONG_ARCHIVED_BY_ADMIN', 'SONG_RESTORED_BY_ADMIN',
    'SONG_UNPUBLISHED_BY_ADMIN', 'USER_ACTIVE', 'USER_SUSPENDED',
    'USER_WARNED', 'USER_WARNED_FROM_REFLECTION', 'USER_WARNING_ACKNOWLEDGED', 'USER_WARNING_RESOLVED',
    'USER_WARNING_WITHDRAWN',
];
const SAFETY_ACTION_TYPE_SET = new Set(SAFETY_ACTION_TYPES);
const SAFETY_REPORT_OUTCOMES = {
    DISMISS_REPORT: { action: 'SAFETY_REPORT_DISMISSED', status: 'APPROVED' },
    REMOVE_REFLECTION: { action: 'REFLECTION_REMOVED_BY_ADMIN', status: 'REJECTED' },
    RETURN_TO_CREATOR: { action: 'SAFETY_REPORT_RETURNED_TO_CREATOR', status: 'PENDING' },
};
const WARNING_CATEGORIES = new Set([
    'HARASSMENT', 'HATE', 'THREATS', 'SEXUAL_CONTENT', 'SPAM', 'IMPERSONATION',
    'PERSONAL_INFORMATION', 'COPYRIGHT_CONCERN', 'DANGEROUS_CONTENT',
    'MISLEADING_CONTENT', 'OFF_TOPIC', 'PLATFORM_MISUSE', 'OTHER',
]);

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
    const missingFields = [];
    if (!value.introduction?.trim()) missingFields.push('Introduction');
    if (!value.experience?.trim()) missingFields.push('Experience');
    if (!value.motivation?.trim()) missingFields.push('Motivation');
    if (!value.contentIdeas?.trim()) missingFields.push('Proposed contribution');
    if (!value.guidelinesAccepted) missingFields.push('Guidelines confirmation');
    if (!value.resumeFileName && !value.portfolioUrl) missingFields.push('Portfolio or resume');
    const latestAdministrativeAction = [...(value.history || [])]
        .reverse()
        .find((entry) => entry.actor?.role === 'ADMIN');
    return {
        ...value,
        allowedTransitions: ADMIN_APPLICATION_TRANSITIONS[value.status] || [],
        completion: { complete: missingFields.length === 0, missingFields },
        hasResume: Boolean(value.resumeFileName),
        latestAdministrativeAction: latestAdministrativeAction ? {
            actorName: latestAdministrativeAction.actor?.name || 'Administrator',
            createdAt: latestAdministrativeAction.createdAt,
            status: latestAdministrativeAction.toStatus,
        } : null,
    };
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

function requiredReason(value, maximum = 2000) {
    const reason = String(value || '').trim();
    return reason.length >= 5 && reason.length <= maximum ? reason : null;
}

function queryDate(value) {
    if (!value) return null;
    const date = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
        ? new Date(`${value}T00:00:00+08:00`)
        : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function safetyCaseType(role) {
    if (role === 'CREATOR') return 'CREATOR_ESCALATION';
    if (role === 'ADMIN') return 'ADMIN_FLAG';
    return 'UNATTRIBUTED_FLAG';
}

function folderTransitions(folder) {
    if (folder.origin === 'PLATFORM') {
        if (folder.status === 'APPROVED') return ['ARCHIVED'];
        if (folder.status === 'ARCHIVED') return ['APPROVED'];
        return [];
    }
    if (folder.status === 'PENDING') return ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'];
    if (folder.status === 'CHANGES_REQUESTED') return ['REJECTED'];
    if (folder.status === 'APPROVED') return ['ARCHIVED'];
    if (folder.status === 'ARCHIVED') return ['APPROVED'];
    return [];
}

function serializeAdminSong(song) {
    const value = song.get ? song.get({ plain: true }) : song;
    const missingFields = getSongPublishMissing(value);
    const latestGeneration = value.generationJobs?.[0] || null;
    const availableActions = ['VIEW_DETAILS'];
    if (value.audioUrl || value.videoUrl) availableActions.push('PREVIEW');
    if (value.status === 'READY' && missingFields.length === 0) availableActions.push('PUBLISH');
    if (value.status === 'PUBLISHED') availableActions.push('UNPUBLISH');
    if (!['GENERATING', 'ARCHIVED'].includes(value.status)) availableActions.push('ARCHIVE');
    if (value.status === 'ARCHIVED') availableActions.push('RESTORE');
    return {
        ...value,
        availableActions,
        generationStatus: latestGeneration?.status || null,
        generationUpdatedAt: latestGeneration?.updatedAt || null,
        generationJobs: undefined,
        publishReadiness: { missingFields, ready: value.status === 'READY' && missingFields.length === 0 },
        publiclyVisible: value.status === 'PUBLISHED',
    };
}

function adminSongIncludes() {
    return [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'accountStatus'] },
        { model: Folder, as: 'folders', attributes: ['id', 'name', 'status'], through: { attributes: ['songOrder'] }, required: false },
        { model: GenerationJob, as: 'generationJobs', attributes: ['id', 'status', 'createdAt', 'updatedAt'], limit: 1, order: [['createdAt', 'DESC']], required: false, separate: true },
    ];
}

async function findAdminSongById(id) {
    return Song.findByPk(id, { include: adminSongIncludes() });
}

function serializeAdminFolder(folder) {
    const value = folder.get ? folder.get({ plain: true }) : folder;
    return {
        ...value,
        allowedTransitions: folderTransitions(value),
        membershipCount: value.songs?.length || 0,
        publiclyVisible: value.status === 'APPROVED',
    };
}

function serializePlacement(proposal) {
    const value = proposal.get ? proposal.get({ plain: true }) : proposal;
    const eligibilityIssues = [];
    if (value.song?.status !== 'PUBLISHED') eligibilityIssues.push('The song must be published before placement can be approved.');
    if (value.folder?.status !== 'APPROVED') eligibilityIssues.push('The collection must be approved before it can receive songs.');
    return {
        ...value,
        allowedTransitions: PLACEMENT_TRANSITIONS[value.status] || [],
        approvalEligibility: { eligible: eligibilityIssues.length === 0, issues: eligibilityIssues },
    };
}

async function duplicateFolderName(name, excludeId) {
    const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
    const where = { name: { [operator]: name } };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    return Folder.findOne({ attributes: ['id'], where });
}

async function countSafetyUsers() {
    const [row] = await sequelize.query(`
        SELECT COUNT(*) AS "count"
        FROM "users" AS "user"
        WHERE "user"."role" IN ('REGISTERED', 'CREATOR')
          AND (
            "user"."account_status" = 'SUSPENDED'
            OR "user"."creator_access_status" = 'SUSPENDED'
            OR "user"."id" IN (SELECT "user_id" FROM "user_warnings")
            OR "user"."id" IN (SELECT "user_id" FROM "reflections" WHERE "status" = 'FLAGGED')
            OR "user"."id" IN (
                SELECT "target_user_id" FROM "moderation_actions"
                WHERE "target_user_id" IS NOT NULL
                  AND "action_type" IN (${SAFETY_ACTION_TYPES.map((type) => `'${type}'`).join(', ')})
            )
          )
    `, { type: QueryTypes.SELECT });
    return Number(row?.count || 0);
}

router.get('/creator-applications', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = { status: { [Op.in]: ADMIN_APPLICATION_STATUSES } };
        if (req.query.status) {
            const status = String(req.query.status).toUpperCase();
            if (!ADMIN_APPLICATION_STATUS_SET.has(status)) return res.status(400).json({ message: 'Invalid application review status.' });
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
                { model: CreatorApplicationHistory, as: 'history', required: false, include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'], required: false }] },
            ],
            distinct: true, limit, offset, order: [['createdAt', 'DESC'], [{ model: CreatorApplicationHistory, as: 'history' }, 'createdAt', 'ASC']], subQuery: false, where,
        });
        return res.json({ applicationStatuses: ADMIN_APPLICATION_STATUSES, applications: rows.map(serializeApplication), pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.patch('/creator-applications/:id/status', async (req, res, next) => {
    try {
        const status = String(req.body.status || '').toUpperCase();
        if (!ADMIN_APPLICATION_STATUS_SET.has(status)) return res.status(400).json({ message: 'Invalid admin application status.' });
        const application = await CreatorApplication.findByPk(req.params.id);
        if (!application) return res.status(404).json({ message: 'Creator application not found.' });
        const allowedTransitions = ADMIN_APPLICATION_TRANSITIONS[application.status] || [];
        if (!allowedTransitions.includes(status)) return res.status(409).json({ message: `Application cannot move from ${application.status} to ${status}.` });
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
            { model: User, as: 'applicant', attributes: ['id', 'name', 'email', 'role', 'accountStatus'] },
            { model: CreatorApplicationHistory, as: 'history', include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'], required: false }] },
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
                ModerationAction.findAll({
                    attributes: ['targetUserId'], group: ['targetUserId'], raw: true,
                    where: { actionType: { [Op.in]: SAFETY_ACTION_TYPES }, targetUserId: { [Op.ne]: null } },
                }),
            ]);
            const safetyUserIds = [...new Set([
                ...warningRows.map((row) => row.userId),
                ...flaggedRows.map((row) => row.userId),
                ...actionRows.map((row) => row.targetUserId),
            ].filter(Boolean))];
            conditions.push({ [Op.or]: [
                { accountStatus: 'SUSPENDED' }, { creatorAccessStatus: 'SUSPENDED' }, { id: { [Op.in]: safetyUserIds } },
            ] });
        }
        if (conditions.length) where[Op.and] = conditions;
        const { count, rows } = await User.findAndCountAll({
            attributes: [
                'id', 'name', 'email', 'role', 'accountStatus', 'accountSuspensionReason',
                'creatorAccessStatus', 'creatorSuspensionReason', 'createdAt', 'updatedAt',
            ],
            include: [
                { model: Reflection, as: 'reflections', attributes: ['id', 'moderatedAt', 'status', 'updatedAt'], required: false },
                { model: UserWarning, as: 'warnings', attributes: ['createdAt', 'id', 'resolvedAt', 'status'], required: false },
            ],
            distinct: true, limit, offset, order: [['createdAt', 'DESC']], subQuery: false, where,
        });
        const safetyActions = rows.length ? await ModerationAction.findAll({
            attributes: ['actionType', 'createdAt', 'reason', 'targetUserId'],
            order: [['createdAt', 'DESC']],
            where: { actionType: { [Op.in]: SAFETY_ACTION_TYPES }, targetUserId: { [Op.in]: rows.map((user) => user.id) } },
        }) : [];
        const latestActionByUser = new Map();
        safetyActions.forEach((action) => {
            if (!latestActionByUser.has(action.targetUserId)) latestActionByUser.set(action.targetUserId, action);
        });
        return res.json({
            pagination: pageResult([], count, page, limit).pagination,
            users: rows.map((user) => {
                const value = user.get({ plain: true });
                const reflections = value.reflections || [];
                const warnings = value.warnings || [];
                const flagged = reflections.filter((reflection) => reflection.status === 'FLAGGED');
                const latestAction = latestActionByUser.get(value.id);
                const eventCandidates = [
                    latestAction && { createdAt: latestAction.createdAt, reason: latestAction.reason, type: latestAction.actionType },
                    ...flagged.map((reflection) => ({ createdAt: reflection.moderatedAt || reflection.updatedAt, type: 'REFLECTION_FLAGGED' })),
                    ...warnings.map((warning) => ({
                        createdAt: warning.resolvedAt || warning.createdAt,
                        type: warning.status === 'RESOLVED' ? 'USER_WARNING_RESOLVED' : 'USER_WARNED',
                    })),
                ].filter(Boolean).sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
                return {
                    ...value,
                    activeWarningCount: warnings.filter((warning) => warning.status === 'ACTIVE').length,
                    flaggedContentCount: flagged.length,
                    latestSafetyEvent: eventCandidates[0] || null,
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
        if (req.query.songId) {
            if (!isUuid(req.query.songId)) return res.status(400).json({ message: 'songId must be a valid UUID.' });
            where.id = req.query.songId;
        }
        if (req.query.status) {
            where.status = String(req.query.status).toUpperCase();
            if (!SONG_STATUS_SET.has(where.status)) return res.status(400).json({ message: 'Invalid song status.' });
        }
        if (req.query.visibility) {
            const visibility = String(req.query.visibility).toUpperCase();
            if (!['PUBLIC', 'NOT_PUBLIC'].includes(visibility)) return res.status(400).json({ message: 'Invalid song visibility.' });
            if (where.status && (visibility === 'PUBLIC') !== (where.status === 'PUBLISHED')) {
                return res.json({ pagination: pageResult([], 0, page, limit).pagination, songStatuses: SONG_STATUSES, songs: [], visibilityOptions: ['PUBLIC', 'NOT_PUBLIC'] });
            }
            if (!where.status) where.status = visibility === 'PUBLIC' ? 'PUBLISHED' : { [Op.ne]: 'PUBLISHED' };
        }
        if (req.query.creatorId) {
            if (!isUuid(req.query.creatorId)) return res.status(400).json({ message: 'creatorId must be a valid UUID.' });
            where.creatorId = req.query.creatorId;
        }
        const search = String(req.query.search || '').trim();
        if (search) {
            const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            where[Op.or] = [
                { title: { [operator]: `%${search}%` } },
                { artist: { [operator]: `%${search}%` } },
                { '$creator.name$': { [operator]: `%${search}%` } },
                { '$creator.email$': { [operator]: `%${search}%` } },
            ];
        }
        const { count, rows } = await Song.findAndCountAll({
            where, limit, offset,
            include: adminSongIncludes(),
            distinct: true, order: [['updatedAt', 'DESC']], subQuery: false,
        });
        return res.json({
            pagination: pageResult([], count, page, limit).pagination,
            songStatuses: SONG_STATUSES,
            songs: rows.map(serializeAdminSong),
            visibilityOptions: ['PUBLIC', 'NOT_PUBLIC'],
        });
    } catch (error) { return next(error); }
});

router.post('/songs/:id/publish', validateUuidParam('id', 'Song ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const note = accessReason(req.body.note, 2000);
        if (note === undefined) return res.status(400).json({ message: 'Publish note must be 2000 characters or fewer.' });
        const song = await Song.findByPk(req.params.id);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status !== 'READY') return res.status(409).json({ message: 'Only a ready song can be published.' });
        const missingFields = getSongPublishMissing(song);
        if (missingFields.length) return res.status(400).json({ message: `Complete these fields before publishing: ${missingFields.join(', ')}.`, missingFields });
        await sequelize.transaction(async (transaction) => {
            await song.update({ publishedDate: new Date(), status: 'PUBLISHED' }, { transaction });
            await writeAudit({
                action: 'SONG_PUBLISHED_BY_ADMIN', actorId: req.authUserRecord.id, creatorId: song.creatorId,
                entityId: song.id, entityType: 'SONG', metadata: { note, previousStatus: 'READY' }, req, songId: song.id, transaction,
            });
        });
        return res.json({ song: serializeAdminSong(await findAdminSongById(song.id)) });
    } catch (error) { return next(error); }
});

router.post('/songs/:id/unpublish', validateUuidParam('id', 'Song ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const reason = accessReason(req.body.reason, 2000);
        if (reason === undefined) return res.status(400).json({ message: 'Unpublish reason must be 2000 characters or fewer.' });
        if (!reason) return res.status(400).json({ message: 'A reason is required to unpublish a song.' });
        const song = await Song.findByPk(req.params.id);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status !== 'PUBLISHED') return res.status(409).json({ message: 'Only a published song can be unpublished.' });
        await sequelize.transaction(async (transaction) => {
            await song.update({ publishedDate: null, status: 'READY' }, { transaction });
            await ModerationAction.create({
                actionType: 'SONG_UNPUBLISHED_BY_ADMIN', actorId: req.authUserRecord.id, reason,
                songId: song.id, targetId: song.id, targetType: 'SONG', targetUserId: song.creatorId,
                metadata: { previousStatus: 'PUBLISHED', resultingStatus: 'READY' },
            }, { transaction });
            await createInProductNotification({
                message: 'Your song was unpublished after an administrator review. Ownership and stored draft data are preserved.',
                title: 'Your song was unpublished', type: 'SONG_UNPUBLISHED', userId: song.creatorId, transaction,
            });
            await writeAudit({
                action: 'SONG_UNPUBLISHED_BY_ADMIN', actorId: req.authUserRecord.id, creatorId: song.creatorId,
                entityId: song.id, entityType: 'SONG', metadata: { previousStatus: 'PUBLISHED', reason }, req, songId: song.id, transaction,
            });
        });
        return res.json({ song: serializeAdminSong(await findAdminSongById(song.id)) });
    } catch (error) { return next(error); }
});

router.post('/songs/:id/archive', validateUuidParam('id', 'Song ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const reason = accessReason(req.body.reason, 2000);
        if (reason === undefined) return res.status(400).json({ message: 'Archive reason must be 2000 characters or fewer.' });
        if (!reason) return res.status(400).json({ message: 'A reason is required to archive a song.' });
        const song = await Song.findByPk(req.params.id);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status === 'GENERATING') return res.status(409).json({ message: 'A song cannot be archived while generation is active.' });
        if (song.status === 'ARCHIVED') return res.status(409).json({ message: 'This song is already archived.' });
        const previousStatus = song.status;
        await sequelize.transaction(async (transaction) => {
            await song.update({ publishedDate: null, status: 'ARCHIVED' }, { transaction });
            await ModerationAction.create({
                actionType: 'SONG_ARCHIVED_BY_ADMIN', actorId: req.authUserRecord.id, reason,
                songId: song.id, targetId: song.id, targetType: 'SONG', targetUserId: song.creatorId,
                metadata: { previousStatus, resultingStatus: 'ARCHIVED' },
            }, { transaction });
            await createInProductNotification({
                message: 'Your song was archived after an administrator review. Ownership and stored data are preserved.',
                title: 'Your song was archived', type: 'SONG_ARCHIVED', userId: song.creatorId, transaction,
            });
            await writeAudit({
                action: 'SONG_ARCHIVED_BY_ADMIN', actorId: req.authUserRecord.id, creatorId: song.creatorId,
                entityId: song.id, entityType: 'SONG', metadata: { previousStatus, reason }, req, songId: song.id, transaction,
            });
        });
        return res.json({ song: serializeAdminSong(await findAdminSongById(song.id)) });
    } catch (error) { return next(error); }
});

router.post('/songs/:id/restore', validateUuidParam('id', 'Song ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const song = await Song.findByPk(req.params.id);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status !== 'ARCHIVED') return res.status(409).json({ message: 'Only an archived song can be restored.' });
        const status = song.videoUrl?.trim() ? 'READY' : 'DRAFT';
        await sequelize.transaction(async (transaction) => {
            await song.update({ publishedDate: null, status }, { transaction });
            await ModerationAction.create({
                actionType: 'SONG_RESTORED_BY_ADMIN', actorId: req.authUserRecord.id,
                songId: song.id, targetId: song.id, targetType: 'SONG', targetUserId: song.creatorId,
                metadata: { previousStatus: 'ARCHIVED', resultingStatus: status },
            }, { transaction });
            await createInProductNotification({
                message: 'Administrator access restrictions on your song were removed. Review it in Creator Studio before publishing.',
                title: 'Your song was restored', type: 'SONG_RESTORED', userId: song.creatorId, transaction,
            });
            await writeAudit({
                action: 'SONG_RESTORED_BY_ADMIN', actorId: req.authUserRecord.id, creatorId: song.creatorId,
                entityId: song.id, entityType: 'SONG', metadata: { previousStatus: 'ARCHIVED', restoredStatus: status }, req, songId: song.id, transaction,
            });
        });
        return res.json({ song: serializeAdminSong(await findAdminSongById(song.id)) });
    } catch (error) { return next(error); }
});

router.patch('/creators/:id/status', validateUuidParam('id', 'Creator ID must be a valid UUID.'), async (req, res, next) => {
    try {
        // accountStatus remains an accepted alias for older admin clients, but
        // this creator-specific endpoint no longer changes whole-account access.
        const creatorAccessStatus = String(req.body.creatorAccessStatus || req.body.accountStatus || '').toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(creatorAccessStatus)) return res.status(400).json({ message: 'creatorAccessStatus must be ACTIVE or SUSPENDED.' });
        const reason = requiredReason(req.body.reason, 1000);
        if (!reason) return res.status(400).json({ message: 'A creator access reason between 5 and 1000 characters is required.' });
        const creator = await User.findOne({ where: { id: req.params.id, role: 'CREATOR' } });
        if (!creator) return res.status(404).json({ message: 'Creator not found.' });
        if (creator.creatorAccessStatus === creatorAccessStatus) {
            return res.status(409).json({ message: `Creator access is already ${creatorAccessStatus.toLowerCase()}.` });
        }
        const nextReason = creatorAccessStatus === 'SUSPENDED'
            ? reason
            : null;
        const action = creatorAccessStatus === 'SUSPENDED' ? 'CREATOR_SUSPENDED' : 'CREATOR_RESTORED';
        await sequelize.transaction(async (transaction) => {
            await creator.update({ creatorAccessStatus, creatorSuspensionReason: nextReason }, { transaction });
            await ModerationAction.create({
                actionType: action, actorId: req.authUserRecord.id, reason,
                targetId: creator.id, targetType: 'USER', targetUserId: creator.id,
                metadata: { accountStatus: creator.accountStatus, creatorAccessStatus },
            }, { transaction });
            await createInProductNotification({
                message: creatorAccessStatus === 'SUSPENDED'
                    ? 'Your creator access was suspended. Normal member access remains active and your songs remain preserved.'
                    : 'Your creator access was restored. Your existing songs and ownership remain available.',
                title: creatorAccessStatus === 'SUSPENDED' ? 'Creator access suspended' : 'Creator access restored',
                type: creatorAccessStatus === 'SUSPENDED' ? 'CREATOR_ACCESS_SUSPENDED' : 'CREATOR_ACCESS_RESTORED',
                userId: creator.id, transaction,
            });
            await writeAudit({
                action, actorId: req.authUserRecord.id, creatorId: creator.id, entityId: creator.id,
                entityType: 'USER', metadata: { accountStatus: creator.accountStatus, creatorAccessStatus, reason }, req, transaction,
            });
        });
        return res.json({ creator: serializeManagedUser(creator) });
    } catch (error) { return next(error); }
});

router.patch('/users/:id/status', validateUuidParam('id', 'User ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const accountStatus = String(req.body.accountStatus || '').toUpperCase();
        if (!['ACTIVE', 'SUSPENDED'].includes(accountStatus)) return res.status(400).json({ message: 'accountStatus must be ACTIVE or SUSPENDED.' });
        const reason = requiredReason(req.body.reason, 1000);
        if (!reason) return res.status(400).json({ message: 'An account action reason between 5 and 1000 characters is required.' });
        if (req.params.id === req.authUserRecord.id) {
            return res.status(403).json({ message: 'Administrators cannot change their own account access through this workflow.' });
        }
        const user = await User.findOne({ where: { id: req.params.id, role: { [Op.in]: ['REGISTERED', 'CREATOR'] } } });
        if (!user) return res.status(404).json({ message: 'Manageable user not found.' });
        if (user.accountStatus === accountStatus) {
            return res.status(409).json({ message: `Member account is already ${accountStatus.toLowerCase()}.` });
        }
        const nextReason = accountStatus === 'SUSPENDED'
            ? reason
            : null;
        const auditAction = accountStatus === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESTORED';
        await sequelize.transaction(async (transaction) => {
            await user.update({ accountStatus, accountSuspensionReason: nextReason }, { transaction });
            await ModerationAction.create({
                actionType: `USER_${accountStatus}`, actorId: req.authUserRecord.id, reason,
                targetId: user.id, targetType: 'USER', targetUserId: user.id,
                metadata: { creatorAccessStatus: user.creatorAccessStatus, publishedContentBehavior: 'UNCHANGED' },
            }, { transaction });
            await createInProductNotification({
                message: accountStatus === 'SUSPENDED'
                    ? 'Your member account was suspended. Stored profile, content, scores, badges, applications and history remain preserved.'
                    : 'Your member account access was restored. Existing stored data remains available.',
                title: accountStatus === 'SUSPENDED' ? 'Member account suspended' : 'Member account restored',
                type: accountStatus === 'SUSPENDED' ? 'MEMBER_ACCOUNT_SUSPENDED' : 'MEMBER_ACCOUNT_RESTORED',
                userId: user.id, transaction,
            });
            await writeAudit({
                action: auditAction, actorId: req.authUserRecord.id, creatorId: user.role === 'CREATOR' ? user.id : null,
                entityId: user.id, entityType: 'USER', metadata: {
                    accountStatus, creatorAccessStatus: user.creatorAccessStatus,
                    publishedContentBehavior: 'UNCHANGED', reason,
                }, req, transaction,
            });
        });
        return res.json({ user: serializeManagedUser(user) });
    } catch (error) { return next(error); }
});

router.get('/folders', async (req, res, next) => {
    try {
        const where = req.query.status ? { status: String(req.query.status).toUpperCase() } : {};
        if (where.status && !FOLDER_STATUS_SET.has(where.status)) return res.status(400).json({ message: 'Invalid folder status.' });
        const { limit, offset, page } = paging(req.query);
        if (req.query.origin) {
            where.origin = String(req.query.origin).toUpperCase();
            if (!FOLDER_ORIGIN_SET.has(where.origin)) return res.status(400).json({ message: 'Invalid folder origin.' });
        }
        const search = String(req.query.search || '').trim();
        if (search) where.name = { [sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like]: `%${search}%` };
        const { count, rows } = await Folder.findAndCountAll({
            include: [
                { model: User, as: 'proposer', attributes: ['id', 'name', 'email'], required: false },
                {
                    model: Song, as: 'songs', attributes: ['id', 'title', 'artist', 'status', 'creatorId'],
                    through: { attributes: ['songOrder'] }, required: false,
                    include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
                },
            ],
            distinct: true, limit, offset, order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']], subQuery: false, where,
        });
        return res.json({
            folderOrigins: FOLDER_ORIGINS,
            folderStatuses: FOLDER_STATUSES,
            folders: rows.map(serializeAdminFolder),
            pagination: pageResult([], count, page, limit).pagination,
        });
    } catch (error) { return next(error); }
});

router.post('/folders', async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const slug = String(req.body.slug || name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        if (name.length < 2 || name.length > 255 || !slug) return res.status(400).json({ message: 'A valid folder name is required.' });
        const description = String(req.body.description || '').trim() || null;
        if (description && description.length > 2000) return res.status(400).json({ message: 'Collection description must be 2000 characters or fewer.' });
        const displayOrder = Number(req.body.displayOrder || 0);
        if (!Number.isInteger(displayOrder) || displayOrder < 0) return res.status(400).json({ message: 'displayOrder must be a non-negative integer.' });
        if (await duplicateFolderName(name)) return res.status(409).json({ message: 'A collection with this name already exists.' });
        const folder = await Folder.create({ createdBy: req.authUserRecord.id, description, displayOrder, name, origin: 'PLATFORM', slug, status: 'APPROVED' });
        await writeAudit({ action: 'PLATFORM_FOLDER_CREATED', actorId: req.authUserRecord.id, entityId: folder.id, entityType: 'FOLDER', req });
        return res.status(201).json({ folder: serializeAdminFolder(folder) });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'A collection with this name or slug already exists.' });
        return next(error);
    }
});

router.patch('/folders/:id', validateUuidParam('id', 'Collection ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const folder = await Folder.findByPk(req.params.id);
        if (!folder) return res.status(404).json({ message: 'Folder not found.' });
        const updates = {};
        if (req.body.status !== undefined) {
            updates.status = String(req.body.status).toUpperCase();
            if (!FOLDER_STATUS_SET.has(updates.status)) return res.status(400).json({ message: 'Invalid folder status.' });
            if (!folderTransitions(folder).includes(updates.status)) return res.status(409).json({ message: `Collection cannot move from ${folder.status} to ${updates.status}.` });
            updates.reviewedAt = new Date();
            updates.reviewedBy = req.authUserRecord.id;
        }
        if (req.body.name !== undefined) {
            updates.name = String(req.body.name).trim();
            if (updates.name.length < 2 || updates.name.length > 255) return res.status(400).json({ message: 'Folder name must be between 2 and 255 characters.' });
            if (await duplicateFolderName(updates.name, folder.id)) return res.status(409).json({ message: 'A collection with this name already exists.' });
        }
        if (req.body.description !== undefined) {
            updates.description = String(req.body.description || '').trim() || null;
            if (updates.description && updates.description.length > 2000) return res.status(400).json({ message: 'Collection description must be 2000 characters or fewer.' });
        }
        const reviewNote = accessReason(req.body.reviewNote, 2000);
        if (reviewNote === undefined) return res.status(400).json({ message: 'Review note must be 2000 characters or fewer.' });
        if (req.body.reviewNote !== undefined) updates.reviewNote = reviewNote;
        if (updates.status && ['CHANGES_REQUESTED', 'REJECTED', 'ARCHIVED'].includes(updates.status) && !reviewNote) {
            return res.status(400).json({ message: 'A reason is required for this collection action.' });
        }
        if (req.body.displayOrder !== undefined) {
            updates.displayOrder = Number(req.body.displayOrder);
            if (!Number.isInteger(updates.displayOrder) || updates.displayOrder < 0) return res.status(400).json({ message: 'displayOrder must be a non-negative integer.' });
        }
        const previousStatus = folder.status;
        await folder.update(updates);
        await writeAudit({
            action: `FOLDER_${updates.status || 'UPDATED'}`, actorId: req.authUserRecord.id, creatorId: folder.proposedBy,
            entityId: folder.id, entityType: 'FOLDER', metadata: { previousStatus, reviewNote }, req,
        });
        return res.json({ folder: serializeAdminFolder(folder) });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'A collection with this name or slug already exists.' });
        return next(error);
    }
});

router.get('/folder-song-proposals', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.status) {
            where.status = String(req.query.status).toUpperCase();
            if (!PLACEMENT_STATUS_SET.has(where.status)) return res.status(400).json({ message: 'Invalid placement proposal status.' });
        }
        const { count, rows } = await FolderSongProposal.findAndCountAll({
            where, limit, offset, distinct: true, order: [['createdAt', 'DESC']],
            include: [
                { model: Song, as: 'song', attributes: ['id', 'title', 'status', 'creatorId'], include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }] },
                { model: Folder, as: 'folder', attributes: ['id', 'name', 'status'] },
                { model: User, as: 'proposer', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'proposalReviewer', attributes: ['id', 'name'], required: false },
            ],
        });
        return res.json({
            pagination: pageResult([], count, page, limit).pagination,
            placementStatuses: PLACEMENT_STATUSES,
            proposals: rows.map(serializePlacement),
        });
    } catch (error) { return next(error); }
});

router.patch('/folder-song-proposals/:id', validateUuidParam('id', 'Placement request ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const status = String(req.body.status || '').toUpperCase();
        if (!['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'].includes(status)) return res.status(400).json({ message: 'Status must be APPROVED, REJECTED, or CHANGES_REQUESTED.' });
        const reviewNote = String(req.body.reviewNote || '').trim() || null;
        if (reviewNote && reviewNote.length > 2000) return res.status(400).json({ message: 'Review note must be 2000 characters or fewer.' });
        if (status !== 'APPROVED' && !reviewNote) return res.status(400).json({ message: 'A review note is required.' });
        const proposal = await FolderSongProposal.findByPk(req.params.id, { include: [{ model: Song, as: 'song', attributes: ['id', 'creatorId', 'status'] }, { model: Folder, as: 'folder', attributes: ['id', 'status'] }] });
        if (!proposal) return res.status(404).json({ message: 'Placement proposal not found.' });
        if (!(PLACEMENT_TRANSITIONS[proposal.status] || []).includes(status)) return res.status(409).json({ message: `Placement request cannot move from ${proposal.status} to ${status}.` });
        if (status === 'APPROVED' && proposal.folder.status !== 'APPROVED') return res.status(409).json({ message: 'Only approved folders can receive songs.' });
        if (status === 'APPROVED' && proposal.song.status !== 'PUBLISHED') return res.status(409).json({ message: 'Only published songs can be added to a collection.' });
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
        return res.json({ proposal: serializePlacement(proposal) });
    } catch (error) { return next(error); }
});

router.put('/folders/:folderId/songs/:songId', validateUuidParam('folderId', 'Collection ID must be a valid UUID.'), validateUuidParam('songId', 'Song ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const [folder, song] = await Promise.all([
            Folder.findOne({ where: { id: req.params.folderId, status: 'APPROVED' } }),
            Song.findByPk(req.params.songId),
        ]);
        if (!folder || !song) return res.status(404).json({ message: 'Approved folder or song not found.' });
        if (song.status !== 'PUBLISHED') return res.status(409).json({ message: 'Only published songs can be added to a collection.' });
        const songOrder = Number(req.body.songOrder || 0);
        if (!Number.isInteger(songOrder) || songOrder < 0) return res.status(400).json({ message: 'songOrder must be a non-negative integer.' });
        const [link, created] = await SongFolder.findOrCreate({ defaults: { addedBy: req.authUserRecord.id, songOrder }, where: { folderId: folder.id, songId: song.id } });
        if (!created) await link.update({ addedBy: req.authUserRecord.id, songOrder });
        await writeAudit({ action: 'ADMIN_SONG_FOLDER_ASSIGNED', actorId: req.authUserRecord.id, creatorId: song.creatorId, entityId: folder.id, entityType: 'FOLDER', req, songId: song.id });
        return res.status(created ? 201 : 200).json({ link });
    } catch (error) { return next(error); }
});

router.delete('/folders/:folderId/songs/:songId', validateUuidParam('folderId', 'Collection ID must be a valid UUID.'), validateUuidParam('songId', 'Song ID must be a valid UUID.'), async (req, res, next) => {
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
        const [admins, creators, registeredUsers, songs, publishedSongs, scores, reflections, generationJobs, eventRows, pendingApplications, pendingReflections, flaggedReflections, unresolvedWarnings, suspendedAccounts, recentEvents, creatorApplications, collections, placementRequests, safetyUsers, warningRecords] = await Promise.all([
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
            CreatorApplication.count({ where: { status: { [Op.in]: ADMIN_APPLICATION_STATUSES } } }),
            Folder.count(),
            FolderSongProposal.count({ where: { status: 'PENDING' } }),
            countSafetyUsers(),
            UserWarning.count(),
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
            tabCounts: {
                collections,
                creatorApplications,
                creators,
                placementRequests,
                reports: flaggedReflections,
                songs,
                users: safetyUsers,
                warnings: warningRecords,
            },
            users: { admins, creators, registered: registeredUsers, total: admins + creators + registeredUsers },
        });
    } catch (error) { return next(error); }
});

router.get('/safety-reports', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query, 50);
        const where = { status: 'FLAGGED' };
        const search = String(req.query.search || '').trim();
        const dateFromValue = String(req.query.dateFrom || '').trim();
        const dateFrom = queryDate(dateFromValue);
        if (dateFromValue && !dateFrom) return res.status(400).json({ message: 'dateFrom must be a valid date.' });
        if (dateFrom) where.moderatedAt = { [Op.gte]: dateFrom };
        if (search) {
            const operator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
            const pattern = `%${search}%`;
            where[Op.or] = [
                { content: { [operator]: pattern } },
                { displayName: { [operator]: pattern } },
                { '$song.title$': { [operator]: pattern } },
                { '$user.name$': { [operator]: pattern } },
                { '$user.email$': { [operator]: pattern } },
            ];
        }
        const { count, rows } = await Reflection.findAndCountAll({
            distinct: true,
            include: [
                {
                    model: Song, as: 'song', attributes: ['creatorId', 'id', 'status', 'title'], required: true,
                    include: [{ model: User, as: 'creator', attributes: ['id', 'name'], required: false }],
                },
                {
                    model: User, as: 'user', required: false,
                    attributes: ['accountStatus', 'creatorAccessStatus', 'email', 'id', 'name', 'role'],
                },
                { model: User, as: 'moderator', attributes: ['id', 'name', 'role'], required: false },
                {
                    model: ReflectionComment, as: 'comments', required: false, separate: true,
                    attributes: ['content', 'createdAt', 'id', 'status'],
                    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'], required: false }],
                    order: [['createdAt', 'ASC']],
                },
            ],
            limit, offset, order: [['moderatedAt', 'DESC'], ['updatedAt', 'DESC']], subQuery: false, where,
        });
        const reflectionIds = rows.map((reflection) => reflection.id);
        const [actions, flags] = reflectionIds.length ? await Promise.all([ModerationAction.findAll({
            include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'role'], required: false }],
            order: [['createdAt', 'ASC']],
            where: {
                actionType: { [Op.in]: SAFETY_ACTION_TYPES },
                targetId: { [Op.in]: reflectionIds }, targetType: 'REFLECTION',
            },
        }), ModerationFlag.findAll({ order: [['createdAt', 'ASC']], where: { targetId: { [Op.in]: reflectionIds }, targetType: 'REFLECTION' } })]) : [[], []];
        const actionsByReflection = new Map();
        actions.forEach((action) => {
            const list = actionsByReflection.get(action.targetId) || [];
            list.push(action.get({ plain: true }));
            actionsByReflection.set(action.targetId, list);
        });
        const flagsByReflection = new Map();
        flags.forEach((flag) => {
            const list = flagsByReflection.get(flag.targetId) || [];
            list.push(flag.get({ plain: true }));
            flagsByReflection.set(flag.targetId, list);
        });
        const reports = rows.map((reflection) => {
            const value = reflection.get({ plain: true });
            const history = actionsByReflection.get(value.id) || [];
            const recordedFlags = flagsByReflection.get(value.id) || [];
            const signals = history.filter((action) => action.actionType === 'REFLECTION_FLAGGED');
            const caseTypes = [...new Set((signals.length ? signals : [{ actor: value.moderator }])
                .map((signal) => safetyCaseType(signal.actor?.role)))];
            const reportedTimes = signals.map((signal) => signal.createdAt).filter(Boolean);
            const fallbackTime = value.moderatedAt || value.updatedAt;
            const reasons = [...new Set([
                ...signals.map((signal) => signal.reason), value.moderatorNote,
            ].map((reason) => String(reason || '').trim()).filter(Boolean))];
            return {
                account: value.user ? {
                    accountStatus: value.user.accountStatus,
                    creatorAccessStatus: value.user.creatorAccessStatus,
                    email: value.user.email, id: value.user.id, name: value.user.name, role: value.user.role,
                } : null,
                caseTypes,
                comments: (value.comments || []).map((comment) => ({
                    content: comment.content, contributor: comment.user ? { name: comment.user.name, role: comment.user.role } : null,
                    createdAt: comment.createdAt, id: comment.id, status: comment.status,
                })),
                content: value.content,
                displayName: value.displayName,
                firstReportedAt: reportedTimes[0] || fallbackTime,
                flagSources: recordedFlags.length ? [...new Set(recordedFlags.map((flag) => flag.source))] : caseTypes,
                id: value.id,
                latestReportedAt: reportedTimes.at(-1) || fallbackTime,
                moderationHistory: history.map((action) => ({
                    actionType: action.actionType,
                    actor: action.actor ? { name: action.actor.name, role: action.actor.role } : null,
                    createdAt: action.createdAt, reason: action.reason,
                })),
                reasons,
                reportCount: Math.max(signals.length, recordedFlags.length, 1),
                requiredAction: 'ADMIN_REVIEW',
                reviewState: 'OPEN',
                song: value.song,
                targetType: 'REFLECTION',
                userId: value.userId,
            };
        });
        return res.json({ pagination: pageResult([], count, page, limit).pagination, reports });
    } catch (error) { return next(error); }
});

router.post('/safety-reports/:id/resolve', validateUuidParam('id', 'Report target ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const outcome = String(req.body.outcome || '').toUpperCase();
        const transition = SAFETY_REPORT_OUTCOMES[outcome];
        if (!transition) return res.status(400).json({ message: 'Unsupported safety report outcome.' });
        const reason = requiredReason(req.body.reason);
        if (!reason) return res.status(400).json({ message: 'A resolution reason between 5 and 2000 characters is required.' });
        const reflection = await Reflection.findByPk(req.params.id, {
            include: [{ model: Song, as: 'song', attributes: ['creatorId', 'id', 'status'] }],
        });
        if (!reflection) return res.status(404).json({ message: 'Reported reflection not found.' });
        if (reflection.status !== 'FLAGGED') {
            return res.status(409).json({ message: 'This safety case is no longer open.' });
        }
        await sequelize.transaction(async (transaction) => {
            await reflection.update({
                moderatedAt: new Date(), moderatedBy: req.authUserRecord.id, status: transition.status,
            }, { transaction });
            await ModerationAction.create({
                actionType: transition.action, actorId: req.authUserRecord.id,
                metadata: { evidencePreserved: true, outcome, previousStatus: 'FLAGGED', resultingStatus: transition.status },
                reason, songId: reflection.songId, targetId: reflection.id,
                targetType: 'REFLECTION', targetUserId: reflection.userId,
            }, { transaction });
            await ModerationFlag.update({
                reviewState: outcome === 'DISMISS_REPORT' ? 'DISMISSED' : 'UPHELD',
                reviewedAt: new Date(), reviewedBy: req.authUserRecord.id,
            }, { transaction, where: { reviewState: 'OPEN', targetId: reflection.id, targetType: 'REFLECTION' } });
            const notificationCopy = {
                DISMISS_REPORT: ['Safety review completed', 'A review of your reflection was completed and it remains eligible for public display.'],
                REMOVE_REFLECTION: ['Your reflection was removed', 'Your reflection is no longer publicly visible. Your member account remains active unless a separate account action is shown.'],
                RETURN_TO_CREATOR: ['Your reflection needs review', 'Your reflection was returned to pending review and is not currently public.'],
            }[outcome];
            await createInProductNotification({
                message: notificationCopy[1], title: notificationCopy[0], type: transition.action,
                userId: reflection.userId, transaction,
            });
            await writeAudit({
                action: transition.action, actorId: req.authUserRecord.id,
                creatorId: reflection.song?.creatorId || null, entityId: reflection.id,
                entityType: 'REFLECTION', metadata: {
                    evidencePreserved: true, outcome, previousStatus: 'FLAGGED', reason, resultingStatus: transition.status,
                }, req, songId: reflection.songId, transaction,
            });
        });
        return res.json({
            outcome, reflection: { id: reflection.id, status: transition.status },
            userNotificationSent: Boolean(reflection.userId),
        });
    } catch (error) { return next(error); }
});

router.get('/moderation-flags', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query, 100);
        const where = {};
        if (req.query.reviewState) {
            const reviewState = String(req.query.reviewState).toUpperCase();
            if (!['OPEN', 'DISMISSED', 'UPHELD'].includes(reviewState)) return res.status(400).json({ message: 'Invalid flag review state.' });
            where.reviewState = reviewState;
        }
        if (req.query.source) {
            const source = String(req.query.source).toUpperCase();
            if (!['USER_REPORT', 'AUTOMATED_RULE', 'ADMIN_REVIEW', 'BEHAVIOURAL_PATTERN'].includes(source)) return res.status(400).json({ message: 'Invalid flag source.' });
            where.source = source;
        }
        const { count, rows } = await ModerationFlag.findAndCountAll({
            include: [{ model: User, as: 'targetUser', attributes: ['accountStatus', 'creatorAccessStatus', 'email', 'id', 'name', 'role'], required: false }],
            limit, offset, order: [['createdAt', 'DESC']], where,
        });
        return res.json({ flags: rows, pagination: pageResult([], count, page, limit).pagination });
    } catch (error) { return next(error); }
});

router.patch('/moderation-flags/:id/review', validateUuidParam('id', 'Flag ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const reviewState = String(req.body.reviewState || '').toUpperCase();
        if (!['DISMISSED', 'UPHELD'].includes(reviewState)) return res.status(400).json({ message: 'reviewState must be DISMISSED or UPHELD.' });
        const reason = requiredReason(req.body.reason);
        if (!reason) return res.status(400).json({ message: 'A review reason between 5 and 2000 characters is required.' });
        const flag = await ModerationFlag.findByPk(req.params.id);
        if (!flag) return res.status(404).json({ message: 'Moderation flag not found.' });
        if (flag.reviewState !== 'OPEN') return res.status(409).json({ message: 'This moderation flag was already reviewed.' });
        await sequelize.transaction(async (transaction) => {
            await flag.update({ reviewState, reviewedAt: new Date(), reviewedBy: req.authUserRecord.id }, { transaction });
            await ModerationAction.create({
                actionType: `MODERATION_FLAG_${reviewState}`, actorId: req.authUserRecord.id,
                metadata: { flagId: flag.id, flagSource: flag.source, triggeringRule: flag.triggeringRule }, reason,
                targetId: flag.targetId, targetType: flag.targetType, targetUserId: flag.targetUserId,
            }, { transaction });
            await writeAudit({
                action: `MODERATION_FLAG_${reviewState}`, actorId: req.authUserRecord.id,
                entityId: flag.id, entityType: 'MODERATION_FLAG', metadata: {
                    flagSource: flag.source, reason, targetId: flag.targetId, targetType: flag.targetType,
                }, req, transaction,
            });
        });
        return res.json({ flag });
    } catch (error) { return next(error); }
});

router.get('/warnings', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.userId) {
            if (!isUuid(req.query.userId)) return res.status(400).json({ message: 'userId must be a valid UUID.' });
            where.userId = req.query.userId;
        }
        if (req.query.status) {
            const status = String(req.query.status).toUpperCase();
            if (!['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'WITHDRAWN'].includes(status)) return res.status(400).json({ message: 'Invalid warning status.' });
            where.status = status;
        }
        const search = String(req.query.search || '').trim();
        if (search) where.reason = { [sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like]: `%${search}%` };
        const dateFromValue = String(req.query.dateFrom || '').trim();
        const dateFrom = queryDate(dateFromValue);
        if (dateFromValue && !dateFrom) return res.status(400).json({ message: 'dateFrom must be a valid date.' });
        if (dateFrom) where.createdAt = { [Op.gte]: dateFrom };
        const { count, rows } = await UserWarning.findAndCountAll({
            include: [
                { model: User, as: 'warnedUser', attributes: ['id', 'name', 'email', 'role', 'accountStatus', 'creatorAccessStatus'] },
                { model: User, as: 'issuer', attributes: ['id', 'name'] },
                { model: User, as: 'resolver', attributes: ['id', 'name'], required: false },
            ], limit, offset, order: [['createdAt', 'DESC']], where,
        });
        const warningIds = rows.map((warning) => warning.id);
        const warnedUserIds = [...new Set(rows.map((warning) => warning.userId))];
        const warningActions = warningIds.length ? await ModerationAction.findAll({
            include: [{ model: Song, as: 'song', attributes: ['id', 'title'], required: false }],
            order: [['createdAt', 'ASC']],
            where: {
                actionType: { [Op.in]: ['USER_WARNED', 'USER_WARNED_FROM_REFLECTION'] },
                targetUserId: { [Op.in]: warnedUserIds },
            },
        }) : [];
        const sourceByWarning = new Map();
        warningActions.forEach((action) => {
            const warningId = action.metadata?.warningId;
            if (!warningIds.includes(warningId) || sourceByWarning.has(warningId)) return;
            sourceByWarning.set(warningId, action.targetType === 'REFLECTION' ? {
                id: action.targetId, song: action.song, type: 'REFLECTION',
            } : null);
        });
        return res.json({
            pagination: pageResult([], count, page, limit).pagination,
            warnings: rows.map((warning) => ({
                ...warning.get({ plain: true }), source: sourceByWarning.get(warning.id) || null,
            })),
        });
    } catch (error) { return next(error); }
});

router.post('/warnings', async (req, res, next) => {
    try {
        const userFacingReason = String(req.body.userFacingReason || req.body.reason || '').trim();
        if (userFacingReason.length < 5 || userFacingReason.length > 2000) return res.status(400).json({ message: 'User-facing warning reason must be between 5 and 2000 characters.' });
        const internalNote = String(req.body.internalNote || '').trim() || null;
        if (internalNote && internalNote.length > 2000) return res.status(400).json({ message: 'Internal note must be 2000 characters or fewer.' });
        const category = String(req.body.category || 'OTHER').toUpperCase();
        if (!WARNING_CATEGORIES.has(category)) return res.status(400).json({ message: 'Unsupported warning category.' });
        const actionTaken = String(req.body.actionTaken || '').trim() || null;
        const requiredNextStep = String(req.body.requiredNextStep || '').trim() || null;
        if (actionTaken?.length > 1000 || requiredNextStep?.length > 1000) return res.status(400).json({ message: 'Action and next-step explanations must be 1000 characters or fewer.' });
        if (!isUuid(req.body.userId)) return res.status(400).json({ message: 'userId must be a valid UUID.' });
        const target = await User.findOne({ attributes: ['id'], where: { id: req.body.userId, role: { [Op.in]: ['REGISTERED', 'CREATOR'] } } });
        if (!target) return res.status(404).json({ message: 'User not found.' });
        const duplicate = await UserWarning.findOne({ where: { reason: userFacingReason, status: { [Op.in]: ['ACTIVE', 'ACKNOWLEDGED'] }, userId: target.id } });
        if (duplicate) return res.status(409).json({ message: 'An active warning with this reason already exists for the user.' });
        const sourceType = req.body.sourceType ? String(req.body.sourceType).toUpperCase() : null;
        const sourceId = req.body.sourceId || null;
        let source = null;
        if (sourceType || sourceId) {
            if (sourceType !== 'REFLECTION') return res.status(400).json({ message: 'Unsupported warning source type.' });
            if (!isUuid(sourceId)) return res.status(400).json({ message: 'sourceId must be a valid UUID.' });
            const reflection = await Reflection.findByPk(sourceId, {
                include: [{ model: Song, as: 'song', attributes: ['id', 'title'] }],
            });
            if (!reflection) return res.status(404).json({ message: 'Warning source reflection not found.' });
            if (reflection.userId !== target.id) return res.status(409).json({ message: 'The warning source does not belong to this user.' });
            source = { id: reflection.id, song: reflection.song, type: 'REFLECTION' };
        }
        const warning = await sequelize.transaction(async (transaction) => {
            const created = await UserWarning.create({
                actionTaken, category, internalNote, issuedBy: req.authUserRecord.id,
                reason: userFacingReason, requiredNextStep, targetId: source?.id || null,
                targetType: source?.type || null, userFacingReason, userId: target.id,
            }, { transaction });
            await ModerationAction.create({
                actionType: source ? 'USER_WARNED_FROM_REFLECTION' : 'USER_WARNED', actorId: req.authUserRecord.id,
                metadata: { category, warningId: created.id }, reason: userFacingReason, songId: source?.song?.id || null,
                targetId: source?.id || target.id, targetType: source?.type || 'USER', targetUserId: target.id,
            }, { transaction });
            await writeAudit({
                action: source ? 'USER_WARNED_FROM_REFLECTION' : 'USER_WARNED', actorId: req.authUserRecord.id,
                entityId: created.id, entityType: 'USER_WARNING',
                metadata: { category, sourceId: source?.id || null, sourceType: source?.type || null, targetUserId: target.id },
                req, songId: source?.song?.id || null, transaction,
            });
            await createInProductNotification({
                message: 'A formal warning is available in Safety & Account Status. Review the details and acknowledge it if required.',
                title: 'You received a formal warning', type: 'WARNING_ISSUED', userId: target.id,
                warningId: created.id, link: `/settings/safety?warning=${created.id}`, transaction,
            });
            return created;
        });
        return res.status(201).json({ source, userNotificationSent: true, warning });
    } catch (error) { return next(error); }
});

async function transitionWarning(req, res, next, forcedStatus = null) {
    try {
        const nextStatus = forcedStatus || String(req.body.status || '').toUpperCase();
        if (!['RESOLVED', 'WITHDRAWN'].includes(nextStatus)) return res.status(400).json({ message: 'Warning status must be RESOLVED or WITHDRAWN.' });
        const note = requiredReason(nextStatus === 'RESOLVED' ? (req.body.resolutionNote || req.body.reason) : req.body.reason);
        if (!note) return res.status(400).json({
            message: nextStatus === 'RESOLVED'
                ? 'A resolution note between 5 and 2000 characters is required.'
                : 'A withdrawal reason between 5 and 2000 characters is required.',
        });
        const result = await sequelize.transaction(async (transaction) => {
            const warning = await UserWarning.findByPk(req.params.id, { lock: transaction.LOCK.UPDATE, transaction });
            if (!warning) return { error: { message: 'Warning not found.', status: 404 } };
            const warnedUser = await User.findByPk(warning.userId, { attributes: ['id'], transaction });
            if (!warnedUser) return { error: { message: 'The warning user no longer exists, so its status cannot be changed.', status: 409 } };
            if (!['ACTIVE', 'ACKNOWLEDGED'].includes(warning.status)) {
                const label = nextStatus === 'RESOLVED' ? 'resolved' : 'withdrawn';
                return { error: { message: warning.status === nextStatus
                    ? `This warning is already ${label}.`
                    : `Only active or acknowledged warnings can be ${label}.`, status: 409 } };
            }
            const previousStatus = warning.status;
            const changedAt = new Date();
            await warning.update({
                resolutionNote: note,
                resolvedAt: nextStatus === 'RESOLVED' ? changedAt : warning.resolvedAt,
                resolvedBy: req.authUserRecord.id,
                status: nextStatus,
                withdrawnAt: nextStatus === 'WITHDRAWN' ? changedAt : warning.withdrawnAt,
            }, { transaction });
            const actionType = nextStatus === 'RESOLVED' ? 'USER_WARNING_RESOLVED' : 'USER_WARNING_WITHDRAWN';
            await ModerationAction.create({
                actionType, actorId: req.authUserRecord.id,
                metadata: { previousStatus, warningId: warning.id }, reason: note,
                targetId: warning.id, targetType: 'USER_WARNING', targetUserId: warning.userId,
            }, { transaction });
            await createInProductNotification({
                message: nextStatus === 'RESOLVED'
                    ? 'A formal warning in your Safety & Account Status history was resolved. The original record remains preserved.'
                    : 'A formal warning in your Safety & Account Status history was withdrawn. It no longer indicates an upheld issue.',
                title: 'Warning status updated', type: nextStatus === 'RESOLVED' ? 'WARNING_RESOLVED' : 'WARNING_WITHDRAWN', userId: warning.userId,
                warningId: warning.id, link: `/settings/safety?warning=${warning.id}`, transaction,
            });
            await writeAudit({
                action: actionType, actorId: req.authUserRecord.id,
                entityId: warning.id, entityType: 'USER_WARNING', metadata: {
                    note, previousStatus, status: nextStatus,
                }, req, transaction,
            });
            return { warning };
        });
        if (result.error) return res.status(result.error.status).json({ message: result.error.message });
        return res.json({ warning: result.warning });
    } catch (error) { return next(error); }
}

router.patch('/warnings/:id/status', validateUuidParam('id', 'Warning ID must be a valid UUID.'), transitionWarning);
router.patch('/warnings/:id/resolve', validateUuidParam('id', 'Warning ID must be a valid UUID.'), (req, res, next) => transitionWarning(req, res, next, 'RESOLVED'));

router.get('/moderation-actions', async (req, res, next) => {
    try {
        const { limit, offset, page } = paging(req.query);
        const where = {};
        if (req.query.actionType) {
            const actionType = String(req.query.actionType).toUpperCase();
            if (!SAFETY_ACTION_TYPE_SET.has(actionType)) return res.status(400).json({ message: 'Unsupported safety action type.' });
            where.actionType = actionType;
        }
        if (req.query.targetType) {
            const targetType = String(req.query.targetType).toUpperCase();
            if (!['REFLECTION', 'REFLECTION_COMMENT', 'SONG', 'USER', 'USER_WARNING'].includes(targetType)) return res.status(400).json({ message: 'Unsupported moderation target type.' });
            where.targetType = targetType;
        }
        if (req.query.actorId) {
            if (!isUuid(req.query.actorId)) return res.status(400).json({ message: 'actorId must be a valid UUID.' });
            where.actorId = req.query.actorId;
        }
        if (req.query.scope) {
            const scope = String(req.query.scope).toLowerCase();
            if (!['account', 'safety'].includes(scope)) return res.status(400).json({ message: 'Invalid moderation action scope.' });
            const scopedTypes = scope === 'account' ? ['USER_SUSPENDED', 'USER_ACTIVE'] : SAFETY_ACTION_TYPES;
            if (where.actionType && !scopedTypes.includes(where.actionType)) {
                return res.json({ actions: [], pagination: pageResult([], 0, page, limit).pagination });
            }
            if (!where.actionType) where.actionType = { [Op.in]: scopedTypes };
        }
        const dateFromValue = String(req.query.dateFrom || '').trim();
        const dateFrom = queryDate(dateFromValue);
        if (dateFromValue && !dateFrom) return res.status(400).json({ message: 'dateFrom must be a valid date.' });
        if (dateFrom) where.createdAt = { [Op.gte]: dateFrom };
        const search = String(req.query.search || '').trim();
        if (search) where.reason = { [sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like]: `%${search}%` };
        const { count, rows } = await ModerationAction.findAndCountAll({
            include: [
                { model: User, as: 'actor', attributes: ['id', 'name', 'email', 'role'] },
                { model: User, as: 'targetUser', attributes: ['id', 'name', 'email', 'role', 'accountStatus', 'creatorAccessStatus'], required: false },
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
        if (req.query.songId) {
            if (!isUuid(req.query.songId)) return res.status(400).json({ message: 'songId must be a valid UUID.' });
            where.songId = req.query.songId;
        }
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
