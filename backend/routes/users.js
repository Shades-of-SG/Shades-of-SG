const express = require('express');
const multer = require('multer');
const { sequelize, User, UserProfile } = require('../models');
const { optionalAuth, requireAuth } = require('../middleware/auth');
const { deleteAsset, uploadImageBuffer } = require('../services/cloudinaryService');
const { validateInterestTags } = require('../services/profileInterests');
const {
    activityFor, findOrCreateProfile, profileValues, publicIdentity,
} = require('../services/userProfileService');
const { recordDailyActivity } = require('../services/streakService');

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, callback) {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
        const error = new Error('Invalid avatar type. Use JPG, PNG, or WebP.');
        error.statusCode = 400;
        return callback(error, false);
    },
    limits: { fileSize: 5 * 1024 * 1024 },
});

function cleanText(value, label, limit, { required = false } = {}) {
    if (value === undefined) return { omitted: true };
    if (typeof value !== 'string') return { error: `${label} must be text.` };
    const cleaned = value.trim();
    if (required && cleaned.length < 2) return { error: `${label} must be at least 2 characters.` };
    if (cleaned.length > limit) return { error: `${label} must be ${limit} characters or fewer.` };
    return { value: cleaned || null };
}

function validateProfile(body) {
    const updates = {};
    for (const [key, label, limit, required] of [
        ['displayName', 'Display name', 80, true], ['bio', 'Bio', 500],
        ['preferredLanguage', 'Preferred language', 40], ['location', 'Location', 100],
    ]) {
        const parsed = cleanText(body[key], label, limit, { required });
        if (parsed.error) return { error: parsed.error };
        if (!parsed.omitted) updates[key] = parsed.value;
    }
    for (const [key, values, label] of [
        ['profileVisibility', ['PUBLIC', 'PRIVATE'], 'Profile visibility'],
        ['theme', ['SYSTEM', 'LIGHT', 'DARK'], 'Theme'],
        ['fontSize', ['SMALL', 'MEDIUM', 'LARGE'], 'Font size'],
    ]) {
        if (body[key] === undefined) continue;
        const value = String(body[key]).toUpperCase();
        if (!values.includes(value)) return { error: `${label} is invalid.` };
        updates[key] = value;
    }
    for (const key of ['reducedMotion', 'showBadges', 'showRhythmRanking', 'showReflections']) {
        if (body[key] === undefined) continue;
        if (typeof body[key] !== 'boolean') return { error: `${key} must be true or false.` };
        updates[key] = body[key];
    }
    if (body.interestTags !== undefined) {
        const parsedTags = validateInterestTags(body.interestTags);
        if (parsedTags.error) return { error: parsedTags.error };
        updates.interestTags = parsedTags.value;
    }
    if (!Object.keys(updates).length) return { error: 'No supported profile fields were provided.' };
    return { updates };
}

async function findNormalUser(userId) {
    return User.findOne({
        include: [{ model: UserProfile, as: 'profile', required: false }],
        where: { accountStatus: 'ACTIVE', id: userId, role: ['REGISTERED', 'CREATOR'] },
    });
}

router.get('/me/profile', requireAuth, async (req, res, next) => {
    try {
        const user = await findNormalUser(req.authUserRecord.id);
        if (!user) return res.status(404).json({ message: 'User profile not found.' });
        await recordDailyActivity(user);
        const profile = profileValues(user, user.profile);
        const activity = await activityFor(user.id, { profile });
        return res.json({
            account: { email: user.email, emailVerified: !user.emailVerificationRequired, isCreator: user.role === 'CREATOR', role: user.role, userId: user.id },
            ...activity,
            profile: { ...profile, createdAt: user.createdAt, userId: user.id },
        });
    } catch (error) { return next(error); }
});

router.patch('/me/profile', requireAuth, async (req, res, next) => {
    try {
        const parsed = validateProfile(req.body || {});
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        const user = await findNormalUser(req.authUserRecord.id);
        if (!user) return res.status(404).json({ message: 'User profile not found.' });
        await sequelize.transaction(async (transaction) => {
            const profile = await findOrCreateProfile(user, transaction);
            await profile.update(parsed.updates, { transaction });
            if (parsed.updates.displayName) await user.update({ name: parsed.updates.displayName }, { transaction });
        });
        await user.reload({ include: [{ model: UserProfile, as: 'profile', required: false }] });
        return res.json({ message: 'Profile updated.', profile: { ...profileValues(user, user.profile), createdAt: user.createdAt, userId: user.id } });
    } catch (error) { return next(error); }
});

router.post('/me/profile/avatar', requireAuth, avatarUpload.single('avatar'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Choose a JPG, PNG, or WebP image to upload.' });
        const user = await findNormalUser(req.authUserRecord.id);
        if (!user) return res.status(404).json({ message: 'User profile not found.' });
        const profile = await findOrCreateProfile(user);
        const previousPublicId = profile.avatarPublicId;
        const uploaded = await uploadImageBuffer(req.file.buffer, { folder: `shades-of-sg/user-avatars/${user.id}` });
        await profile.update({ avatarPublicId: uploaded.public_id, avatarUrl: uploaded.secure_url });
        if (previousPublicId && previousPublicId !== uploaded.public_id) {
            deleteAsset(previousPublicId).catch((error) => console.error('[User avatar cleanup]', error.message));
        }
        return res.json({ message: 'Profile photo updated.', profile: { ...profileValues(user, profile), createdAt: user.createdAt, userId: user.id } });
    } catch (error) { return next(error); }
});

router.delete('/me/profile/avatar', requireAuth, async (req, res, next) => {
    try {
        const user = await findNormalUser(req.authUserRecord.id);
        if (!user) return res.status(404).json({ message: 'User profile not found.' });
        const profile = await UserProfile.findOne({ where: { userId: user.id } });
        const previousPublicId = profile?.avatarPublicId;
        if (profile) await profile.update({ avatarPublicId: null, avatarUrl: null });
        if (previousPublicId) deleteAsset(previousPublicId).catch((error) => console.error('[User avatar cleanup]', error.message));
        return res.json({ message: 'Profile photo removed.', profile: { ...profileValues(user, profile), avatarUrl: '', createdAt: user.createdAt, userId: user.id } });
    } catch (error) { return next(error); }
});

router.get('/:userId/profile', optionalAuth, async (req, res, next) => {
    try {
        if (!UUID_PATTERN.test(req.params.userId)) return res.status(404).json({ message: 'User profile not found.' });
        const user = await findNormalUser(req.params.userId);
        if (!user) return res.status(404).json({ message: 'User profile not found.' });
        const profile = profileValues(user, user.profile);
        const isOwner = req.authUserRecord?.id === user.id;
        if (profile.profileVisibility === 'PRIVATE' && !isOwner) return res.status(404).json({ message: 'User profile not found.' });
        const activity = await activityFor(user.id, { profile, publicView: !isOwner });
        return res.json({ ...activity, isOwner, profile: publicIdentity(user, user.profile) });
    } catch (error) { return next(error); }
});

module.exports = router;
