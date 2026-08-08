const express = require('express');
const multer = require('multer');
const { Op } = require('sequelize');
const { CreatorApplication, CreatorApplicationHistory, User, sequelize } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');
const { sendApplicationEmail } = require('../services/emailService');

const router = express.Router();
const ACTIVE_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW'];
const EDITABLE_STATUSES = ['DRAFT', 'CHANGES_REQUESTED'];
const WITHDRAWABLE_STATUSES = new Set(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED']);
const RESUME_MIME_TYPES = new Set([
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, callback) {
        if (RESUME_MIME_TYPES.has(file.mimetype)) return callback(null, true);
        const error = new Error('Resume must be a PDF or DOCX file.');
        error.statusCode = 400;
        return callback(error, false);
    },
});

function validWebUrl(value) {
    if (!value) return null;
    try {
        const url = new URL(String(value).trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
}

function textField(value, maximum = 5000) {
    const text = String(value || '').trim() || null;
    return text && text.length <= maximum ? text : text === null ? null : undefined;
}

function resumeContentMatchesMime(file) {
    if (!file?.buffer?.length) return false;
    if (file.mimetype === 'application/pdf') {
        return file.buffer.subarray(0, 5).toString('ascii') === '%PDF-';
    }
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        if (file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) return false;
        // DOCX is an OOXML ZIP package. Checking its required package entries
        // prevents an arbitrary ZIP file from being accepted as a resume.
        return file.buffer.includes(Buffer.from('[Content_Types].xml'))
            && file.buffer.includes(Buffer.from('word/document.xml'));
    }
    return false;
}

function serializeApplication(application, { includeInternal = false } = {}) {
    const value = application.get({ plain: true });
    delete value.resumeData;
    delete value.resumeUrl;
    const history = (value.history || []).filter((entry) => includeInternal || entry.visibleToApplicant);
    if (!includeInternal) delete value.adminNotes;
    return { ...value, hasResume: Boolean(value.resumeFileName), history };
}

function applicationValues(body) {
    const portfolioUrl = body.portfolioUrl ? validWebUrl(body.portfolioUrl) : null;
    if (body.portfolioUrl && !portfolioUrl) return { error: 'Portfolio URL must be a valid HTTP or HTTPS URL.' };
    const experience = textField(body.experience);
    const motivation = textField(body.motivation);
    const statement = textField(body.statement);
    const introduction = textField(body.introduction, 2000);
    const contentIdeas = textField(body.contentIdeas, 5000);
    if ([contentIdeas, experience, introduction, motivation, statement].includes(undefined)) return { error: 'Application text fields are too long.' };
    return { values: {
        contentIdeas, experience, guidelinesAccepted: body.guidelinesAccepted === true,
        introduction, motivation, portfolioUrl, statement,
    } };
}

async function notifyApplicant(application, status, feedback = null) {
    const applicant = await User.findByPk(application.userId, { attributes: ['email', 'name'] });
    if (!applicant) return;
    try {
        await sendApplicationEmail({ feedback, name: applicant.name, status, to: applicant.email });
    } catch (error) {
        console.error('[Creator application email]', error.message);
    }
}

async function ownedApplication(req, statuses = null) {
    const where = { id: req.params.id, userId: req.authUserRecord.id };
    if (statuses) where.status = { [Op.in]: statuses };
    return CreatorApplication.findOne({ where });
}

router.get('/mine', requireAuth, async (req, res, next) => {
    try {
        const applications = await CreatorApplication.findAll({
            where: { userId: req.authUserRecord.id },
            include: [{
                model: CreatorApplicationHistory,
                as: 'history',
                required: false,
                where: { visibleToApplicant: true },
                include: [{ model: User, as: 'actor', attributes: ['id', 'name'], required: false }],
            }],
            order: [['createdAt', 'DESC'], [{ model: CreatorApplicationHistory, as: 'history' }, 'createdAt', 'ASC']],
        });
        return res.json({ applications: applications.map((application) => serializeApplication(application)) });
    } catch (error) { return next(error); }
});

router.put('/draft', requireAuth, async (req, res, next) => {
    try {
        if (req.authUserRecord.role !== 'REGISTERED') return res.status(403).json({ message: 'Only registered users can prepare creator applications.' });
        const parsed = applicationValues(req.body);
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        let application = await CreatorApplication.findOne({ where: { userId: req.authUserRecord.id, status: { [Op.in]: EDITABLE_STATUSES } } });
        if (!application) {
            const active = await CreatorApplication.findOne({ where: { userId: req.authUserRecord.id, status: { [Op.in]: ACTIVE_STATUSES } } });
            if (active) return res.status(409).json({ message: 'Your submitted application cannot be edited as a draft.' });
            application = await sequelize.transaction(async (transaction) => {
                const created = await CreatorApplication.create({ ...parsed.values, status: 'DRAFT', userId: req.authUserRecord.id }, { transaction });
                await CreatorApplicationHistory.create({ applicationId: created.id, actorId: req.authUserRecord.id, fromStatus: null, toStatus: 'DRAFT', visibleToApplicant: true }, { transaction });
                return created;
            });
        } else {
            await application.update(parsed.values);
        }
        await writeAudit({ action: 'CREATOR_APPLICATION_DRAFT_SAVED', actorId: req.authUserRecord.id, entityId: application.id, entityType: 'CREATOR_APPLICATION', req });
        return res.json({ application: serializeApplication(application) });
    } catch (error) { return next(error); }
});

router.post('/:id/resume', requireAuth, resumeUpload.single('resume'), async (req, res, next) => {
    try {
        const application = await ownedApplication(req, EDITABLE_STATUSES);
        if (!application) return res.status(404).json({ message: 'Editable application draft not found.' });
        if (!req.file) return res.status(400).json({ message: 'Choose a resume file.' });
        if (!resumeContentMatchesMime(req.file)) return res.status(400).json({ message: 'Resume contents do not match the selected PDF or DOCX file type.' });
        await sequelize.transaction(async (transaction) => {
            await application.update({ resumeData: req.file.buffer, resumeFileName: req.file.originalname.slice(0, 255), resumeFileSize: req.file.size, resumeMimeType: req.file.mimetype }, { transaction });
            await writeAudit({ action: 'CREATOR_APPLICATION_RESUME_UPLOADED', actorId: req.authUserRecord.id, entityId: application.id, entityType: 'CREATOR_APPLICATION', metadata: { fileSize: req.file.size, mimeType: req.file.mimetype }, req, transaction });
        });
        return res.json({ application: serializeApplication(application) });
    } catch (error) { return next(error); }
});

router.delete('/:id/resume', requireAuth, async (req, res, next) => {
    try {
        const application = await ownedApplication(req, EDITABLE_STATUSES);
        if (!application) return res.status(404).json({ message: 'Editable application draft not found.' });
        await sequelize.transaction(async (transaction) => {
            await application.update({ resumeData: null, resumeFileName: null, resumeFileSize: null, resumeMimeType: null }, { transaction });
            await writeAudit({ action: 'CREATOR_APPLICATION_RESUME_REMOVED', actorId: req.authUserRecord.id, entityId: application.id, entityType: 'CREATOR_APPLICATION', req, transaction });
        });
        return res.status(204).end();
    } catch (error) { return next(error); }
});

router.get('/:id/resume', requireAuth, async (req, res, next) => {
    try {
        const where = { id: req.params.id };
        if (req.authUserRecord.role !== 'ADMIN') where.userId = req.authUserRecord.id;
        else where.status = { [Op.ne]: 'DRAFT' };
        const application = await CreatorApplication.findOne({ where, attributes: ['id', 'userId', 'resumeData', 'resumeFileName', 'resumeMimeType'] });
        if (!application?.resumeData) return res.status(404).json({ message: 'Resume not found.' });
        const fileName = String(application.resumeFileName || 'resume').replace(/[\r\n"]/g, '_');
        res.set('Cache-Control', 'private, no-store');
        res.set('Content-Disposition', `attachment; filename="${fileName}"`);
        res.set('X-Content-Type-Options', 'nosniff');
        res.type(application.resumeMimeType || 'application/octet-stream');
        return res.send(application.resumeData);
    } catch (error) { return next(error); }
});

router.post('/:id/submit', requireAuth, async (req, res, next) => {
    try {
        const application = await ownedApplication(req, EDITABLE_STATUSES);
        if (!application) return res.status(404).json({ message: 'Application draft not found.' });
        if (!application.introduction?.trim()) return res.status(400).json({ message: 'A short introduction is required.' });
        if (!application.motivation || application.motivation.trim().length < 50) return res.status(400).json({ message: 'Motivation must be at least 50 characters.' });
        if (!application.experience?.trim()) return res.status(400).json({ message: 'Experience is required.' });
        if (!application.contentIdeas?.trim()) return res.status(400).json({ message: 'Proposed content ideas are required.' });
        if (!application.guidelinesAccepted) return res.status(400).json({ message: 'Accept the creator guidelines before submitting.' });
        if (!application.resumeData && !application.portfolioUrl) return res.status(400).json({ message: 'Upload a resume or add a portfolio URL before submitting.' });
        const previousStatus = application.status;
        await sequelize.transaction(async (transaction) => {
            await application.update({ status: 'SUBMITTED', submittedAt: new Date(), withdrawnAt: null }, { transaction });
            await CreatorApplicationHistory.create({ applicationId: application.id, actorId: req.authUserRecord.id, fromStatus: previousStatus, toStatus: 'SUBMITTED', visibleToApplicant: true }, { transaction });
            await writeAudit({ action: 'CREATOR_APPLICATION_SUBMITTED', actorId: req.authUserRecord.id, entityId: application.id, entityType: 'CREATOR_APPLICATION', req, transaction });
        });
        await notifyApplicant(application, 'SUBMITTED');
        return res.json({
            application: serializeApplication(application),
            message: 'Your creator application has been submitted successfully. Our administrators will review it, and you will receive the outcome or an update by email within seven working days. You can also check your application status from your account.',
        });
    } catch (error) { return next(error); }
});

router.post('/:id/withdraw', requireAuth, async (req, res, next) => {
    try {
        const application = await ownedApplication(req, [...WITHDRAWABLE_STATUSES]);
        if (!application) return res.status(404).json({ message: 'Withdrawable application not found.' });
        const previousStatus = application.status;
        const note = textField(req.body.note, 1000);
        if (note === undefined) return res.status(400).json({ message: 'Withdrawal note must be 1000 characters or fewer.' });
        await sequelize.transaction(async (transaction) => {
            await application.update({ status: 'WITHDRAWN', withdrawnAt: new Date() }, { transaction });
            await CreatorApplicationHistory.create({ applicationId: application.id, actorId: req.authUserRecord.id, fromStatus: previousStatus, note, toStatus: 'WITHDRAWN', visibleToApplicant: true }, { transaction });
            await writeAudit({ action: 'CREATOR_APPLICATION_WITHDRAWN', actorId: req.authUserRecord.id, entityId: application.id, entityType: 'CREATOR_APPLICATION', req, transaction });
        });
        return res.json({ application: serializeApplication(application) });
    } catch (error) { return next(error); }
});

// Backwards-compatible one-step submission for existing clients.
router.post('/', requireAuth, async (req, res, next) => {
    try {
        if (req.authUserRecord.role !== 'REGISTERED') return res.status(403).json({ message: 'Only registered users can apply to become creators.' });
        const parsed = applicationValues({ ...req.body, experience: req.body.experience || req.body.statement, motivation: req.body.motivation || req.body.statement });
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        if (!parsed.values.motivation || parsed.values.motivation.length < 50 || !parsed.values.experience) return res.status(400).json({ message: 'Experience and a motivation of at least 50 characters are required.' });
        if (!parsed.values.portfolioUrl) return res.status(400).json({ message: 'A portfolio URL is required for one-step submission. Use a draft to upload a private resume.' });
        const active = await CreatorApplication.findOne({ where: { userId: req.authUserRecord.id, status: { [Op.in]: ACTIVE_STATUSES } } });
        if (active) return res.status(409).json({ message: 'You already have an active creator application.' });
        const application = await sequelize.transaction(async (transaction) => {
            const created = await CreatorApplication.create({ ...parsed.values, status: 'SUBMITTED', submittedAt: new Date(), userId: req.authUserRecord.id }, { transaction });
            await CreatorApplicationHistory.create({ applicationId: created.id, actorId: req.authUserRecord.id, fromStatus: null, toStatus: 'SUBMITTED', visibleToApplicant: true }, { transaction });
            await writeAudit({ action: 'CREATOR_APPLICATION_SUBMITTED', actorId: req.authUserRecord.id, entityId: created.id, entityType: 'CREATOR_APPLICATION', req, transaction });
            return created;
        });
        await notifyApplicant(application, 'SUBMITTED');
        return res.status(201).json({ application: serializeApplication(application) });
    } catch (error) { return next(error); }
});

module.exports = router;
