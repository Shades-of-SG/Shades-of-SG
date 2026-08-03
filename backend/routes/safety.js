const express = require('express');
const { Op } = require('sequelize');
const {
    AuditLog, ModerationAction, Notification, Reflection, ReflectionComment,
    Song, UserWarning, sequelize,
} = require('../models');
const { requireAuth } = require('../middleware/auth');
const { validateUuidParam } = require('../middleware/validateUuid');

const router = express.Router();
router.use(requireAuth);

function warningStatusText(warning, target, user) {
    if (warning.actionTaken) return warning.actionTaken;
    if (target?.type === 'REFLECTION') {
        return target.status === 'REJECTED'
            ? 'Reflection hidden; member account remains active unless a separate account action is shown.'
            : `Reflection is ${String(target.status || 'under review').toLowerCase()}; account access is handled separately.`;
    }
    if (target?.type === 'REFLECTION_COMMENT') return 'Comment removed; member account access is handled separately.';
    if (target?.type === 'SONG') return `Song is ${String(target.status || 'under review').toLowerCase()}; creator ownership and stored draft data are preserved.`;
    if (user.creatorAccessStatus === 'SUSPENDED') return 'Creator access suspended; normal member access remains active.';
    if (user.accountStatus === 'SUSPENDED') return 'Member account suspended; stored account data remains preserved.';
    return 'Formal warning issued; member account remains active.';
}

async function targetsFor(warnings, userId) {
    const warningIds = warnings.map((warning) => warning.id);
    const actions = warningIds.length ? await ModerationAction.findAll({
        order: [['createdAt', 'ASC']],
        where: { actionType: { [Op.in]: ['USER_WARNED', 'USER_WARNED_FROM_REFLECTION'] }, targetUserId: userId },
    }) : [];
    const legacy = new Map();
    actions.forEach((action) => {
        const warningId = action.metadata?.warningId;
        if (warningId && !legacy.has(warningId)) legacy.set(warningId, { id: action.targetId, type: action.targetType });
    });
    const descriptors = warnings.map((warning) => ({
        id: warning.targetId || legacy.get(warning.id)?.id || null,
        type: warning.targetType || legacy.get(warning.id)?.type || null,
        warningId: warning.id,
    }));
    const ids = (type) => descriptors.filter((item) => item.type === type && item.id).map((item) => item.id);
    const [reflections, comments, songs] = await Promise.all([
        ids('REFLECTION').length ? Reflection.findAll({
            include: [{ model: Song, as: 'song', attributes: ['id', 'status', 'title'] }],
            where: { id: { [Op.in]: ids('REFLECTION') }, userId },
        }) : [],
        ids('REFLECTION_COMMENT').length ? ReflectionComment.findAll({
            include: [{ model: Reflection, as: 'reflection', attributes: ['id', 'songId', 'status'], include: [{ model: Song, as: 'song', attributes: ['id', 'status', 'title'] }] }],
            where: { id: { [Op.in]: ids('REFLECTION_COMMENT') }, userId },
        }) : [],
        ids('SONG').length ? Song.findAll({ where: { creatorId: userId, id: { [Op.in]: ids('SONG') } } }) : [],
    ]);
    const byKey = new Map();
    reflections.forEach((record) => {
        const value = record.get({ plain: true });
        byKey.set(`REFLECTION:${value.id}`, {
            link: value.status === 'APPROVED' && value.song?.status === 'PUBLISHED' ? `/songs/${value.song.id}` : '/profile',
            status: value.status, summary: value.content, title: value.song?.title || 'Reflection', type: 'REFLECTION',
        });
    });
    comments.forEach((record) => {
        const value = record.get({ plain: true });
        const publicLink = value.reflection?.status === 'APPROVED' && value.reflection?.song?.status === 'PUBLISHED';
        byKey.set(`REFLECTION_COMMENT:${value.id}`, {
            link: publicLink ? `/reflections?reflection=${value.reflection.id}` : '/profile',
            status: value.status, summary: value.content, title: value.reflection?.song?.title || 'Reflection comment', type: 'REFLECTION_COMMENT',
        });
    });
    songs.forEach((record) => {
        const value = record.get({ plain: true });
        byKey.set(`SONG:${value.id}`, {
            link: '/creator/songs', status: value.status, summary: value.artist || '', title: value.title, type: 'SONG',
        });
    });
    return new Map(descriptors.map((item) => [item.warningId, byKey.get(`${item.type}:${item.id}`) || null]));
}

router.get('/account-status', async (req, res, next) => {
    try {
        const user = req.authUserRecord;
        const [warnings, notifications] = await Promise.all([
            UserWarning.findAll({ order: [['createdAt', 'DESC']], where: { userId: user.id } }),
            Notification.findAll({ limit: 50, order: [['createdAt', 'DESC']], where: { userId: user.id } }),
        ]);
        const targets = await targetsFor(warnings, user.id);
        return res.json({
            account: {
                accountStatus: user.accountStatus,
                creatorAccessStatus: user.role === 'CREATOR' ? user.creatorAccessStatus : null,
                isCreator: user.role === 'CREATOR',
            },
            appeal: { available: false, supportPath: 'mailto:shadesofsg@gmail.com?subject=Safety%20decision%20support' },
            notifications: notifications.map((notification) => ({
                createdAt: notification.createdAt, id: notification.id, link: notification.link,
                message: notification.message, readAt: notification.readAt, title: notification.title, type: notification.type,
                warningId: notification.warningId,
            })),
            warnings: warnings.map((warning) => {
                const target = targets.get(warning.id);
                return {
                    acknowledgedAt: warning.acknowledgedAt,
                    actionTaken: warningStatusText(warning, target, user),
                    category: warning.category || 'OTHER',
                    createdAt: warning.createdAt,
                    id: warning.id,
                    mustAcknowledge: warning.status === 'ACTIVE',
                    requiredNextStep: warning.status === 'WITHDRAWN'
                        ? 'No action is required. This warning was withdrawn and does not indicate an upheld violation.'
                        : warning.requiredNextStep || (warning.status === 'ACTIVE' ? 'Review and acknowledge this warning.' : 'No acknowledgement is currently required.'),
                    resolvedAt: warning.resolvedAt,
                    status: warning.status,
                    statusExplanation: warning.status === 'WITHDRAWN'
                        ? 'This warning was withdrawn. It remains visible only as part of your account history and does not mean that you remain in violation.'
                        : null,
                    target,
                    userFacingReason: warning.userFacingReason || warning.reason,
                    withdrawnAt: warning.withdrawnAt,
                };
            }),
        });
    } catch (error) { return next(error); }
});

router.patch('/warnings/:id/acknowledge', validateUuidParam('id', 'Warning ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const warning = await UserWarning.findOne({ where: { id: req.params.id, userId: req.authUserRecord.id } });
        if (!warning) return res.status(404).json({ message: 'Warning not found.' });
        if (warning.status !== 'ACTIVE') return res.status(409).json({ message: 'Only an active warning can be acknowledged.' });
        const acknowledgedAt = new Date();
        await sequelize.transaction(async (transaction) => {
            await warning.update({ acknowledgedAt, status: 'ACKNOWLEDGED' }, { transaction });
            await ModerationAction.create({
                actionType: 'USER_WARNING_ACKNOWLEDGED', actorId: req.authUserRecord.id,
                metadata: { warningId: warning.id }, targetId: warning.id,
                targetType: 'USER_WARNING', targetUserId: warning.userId,
            }, { transaction });
            await AuditLog.create({
                action: 'USER_WARNING_ACKNOWLEDGED', actorId: req.authUserRecord.id,
                entityId: warning.id, entityType: 'USER_WARNING', metadata: {},
            }, { transaction });
        });
        return res.json({ acknowledgedAt, status: warning.status });
    } catch (error) { return next(error); }
});

router.patch('/notifications/:id/read', validateUuidParam('id', 'Notification ID must be a valid UUID.'), async (req, res, next) => {
    try {
        const notification = await Notification.findOne({ where: { id: req.params.id, userId: req.authUserRecord.id } });
        if (!notification) return res.status(404).json({ message: 'Notification not found.' });
        if (!notification.readAt) await notification.update({ readAt: new Date() });
        return res.json({ readAt: notification.readAt });
    } catch (error) { return next(error); }
});

module.exports = router;
