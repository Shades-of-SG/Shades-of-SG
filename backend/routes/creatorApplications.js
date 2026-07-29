const express = require('express');
const { Op } = require('sequelize');
const { CreatorApplication } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { writeAudit } = require('../services/auditService');

const router = express.Router();
const ACTIVE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW'];

function validWebUrl(value) {
    if (!value) return null;
    try {
        const url = new URL(String(value).trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    } catch {
        return null;
    }
}

router.get('/mine', requireAuth, async (req, res, next) => {
    try {
        const applications = await CreatorApplication.findAll({
            where: { userId: req.authUserRecord.id },
            order: [['createdAt', 'DESC']],
        });
        return res.json({ applications });
    } catch (error) { return next(error); }
});

router.post('/', requireAuth, async (req, res, next) => {
    try {
        if (req.authUserRecord.role !== 'REGISTERED') {
            return res.status(403).json({ message: 'Only registered users can apply to become creators.' });
        }
        const statement = String(req.body.statement || '').trim();
        const resumeUrl = validWebUrl(req.body.resumeUrl);
        const portfolioUrl = validWebUrl(req.body.portfolioUrl);
        if (statement.length < 50 || statement.length > 5000) {
            return res.status(400).json({ message: 'Statement must be between 50 and 5000 characters.' });
        }
        if (!resumeUrl && !portfolioUrl) {
            return res.status(400).json({ message: 'A valid resume or portfolio URL is required.' });
        }
        const active = await CreatorApplication.findOne({
            where: { userId: req.authUserRecord.id, status: { [Op.in]: ACTIVE_STATUSES } },
        });
        if (active) return res.status(409).json({ message: 'You already have an active creator application.' });

        const application = await CreatorApplication.create({
            portfolioUrl,
            resumeUrl,
            statement,
            status: 'SUBMITTED',
            userId: req.authUserRecord.id,
        });
        await writeAudit({
            action: 'CREATOR_APPLICATION_SUBMITTED', actorId: req.authUserRecord.id,
            entityId: application.id, entityType: 'CREATOR_APPLICATION', req,
        });
        return res.status(201).json({ application });
    } catch (error) { return next(error); }
});

module.exports = router;

