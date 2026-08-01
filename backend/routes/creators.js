const express = require('express');
const multer = require('multer');
const {
    CreatorProfile, Folder, Reflection, Song, SongFolder, User, UserProfile,
} = require('../models');
const { optionalAuth, requireCreator } = require('../middleware/auth');
const { deleteAsset, uploadImageBuffer } = require('../services/cloudinaryService');
const { findOrCreateProfile, profileValues } = require('../services/userProfileService');

const router = express.Router();
const SOCIAL_KEYS = new Set(['instagram', 'tiktok', 'website', 'youtube']);
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

const PROFILE_DEFAULTS = Object.freeze({
  bio: '',
  contentFocus: [],
  creatorTitle: '',
  featuredQuote: '',
  languages: [],
  location: '',
  showCommunityReflections: true,
  socialLinks: {},
  tagline: '',
  visibility: 'PUBLIC',
})

function publicProfile(user, storedProfile, storedUserProfile = user.profile) {
    const value = storedProfile?.get ? storedProfile.get({ plain: true }) : storedProfile || {};
    const identity = profileValues(user, storedUserProfile);
    return {
        avatarUrl: identity.avatarUrl,
        bio: value.bio ?? PROFILE_DEFAULTS.bio,
        contentFocus: Array.isArray(value.contentFocus) ? value.contentFocus : PROFILE_DEFAULTS.contentFocus,
        creatorId: user.id,
        creatorSince: String(new Date(user.createdAt).getFullYear()),
        creatorTitle: value.creatorTitle ?? PROFILE_DEFAULTS.creatorTitle,
        displayName: identity.displayName,
        featuredQuote: value.featuredQuote ?? PROFILE_DEFAULTS.featuredQuote,
        languages: Array.isArray(value.languages) ? value.languages : PROFILE_DEFAULTS.languages,
        location: identity.location || value.location || PROFILE_DEFAULTS.location,
        socialLinks: value.socialLinks || {},
        tagline: value.tagline ?? PROFILE_DEFAULTS.tagline,
    };
}

function editableProfile(user, storedProfile, storedUserProfile = user.profile) {
    const value = storedProfile?.get ? storedProfile.get({ plain: true }) : storedProfile || {};
    return {
        ...publicProfile(user, storedProfile, storedUserProfile),
        showCommunityReflections: value.showCommunityReflections ?? PROFILE_DEFAULTS.showCommunityReflections,
        visibility: value.visibility || PROFILE_DEFAULTS.visibility,
    };
}

function cleanText(value, field, limit, { required = false } = {}) {
    if (value === undefined) return { omitted: true };
    if (typeof value !== 'string') return { error: `${field} must be text.` };
    const cleaned = value.trim();
    if (required && cleaned.length < 2) return { error: `${field} must be at least 2 characters.` };
    if (cleaned.length > limit) return { error: `${field} must be ${limit} characters or fewer.` };
    return { value: cleaned };
}

function cleanList(value, field) {
    if (value === undefined) return { omitted: true };
    if (!Array.isArray(value)) return { error: `${field} must be a list.` };
    const values = [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
    if (values.length > 10 || values.some((item) => item.length > 40)) {
        return { error: `${field} may contain up to 10 values of 40 characters or fewer.` };
    }
    return { value: values };
}

function cleanSocialLinks(value) {
    if (value === undefined) return { omitted: true };
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'socialLinks must be an object.' };
    const links = {};
    for (const [key, rawUrl] of Object.entries(value)) {
        if (!SOCIAL_KEYS.has(key)) return { error: `Unsupported social link: ${key}.` };
        const url = String(rawUrl || '').trim();
        if (!url || ['http://', 'https://'].includes(url.toLowerCase())) continue;
        if (url.length > 500) return { error: `${key} link must be 500 characters or fewer.` };
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('protocol');
        } catch {
            return { error: `${key} must be a valid http or https URL.` };
        }
        links[key] = url;
    }
    return { value: links };
}

function validateProfile(body) {
    const updates = {};
    const textFields = [
        ['displayName', 'Display name', 80, true],
        ['tagline', 'Tagline', 160],
        ['bio', 'Bio', 2000],
        ['location', 'Location', 100],
        ['creatorTitle', 'Creator title', 100],
        ['featuredQuote', 'Featured quote', 300],
    ];
    for (const [key, label, limit, required] of textFields) {
        const parsed = cleanText(body[key], label, limit, { required });
        if (parsed.error) return { error: parsed.error };
        if (!parsed.omitted) updates[key] = parsed.value;
    }
    for (const [key, label] of [['languages', 'Languages'], ['contentFocus', 'Content focus']]) {
        const parsed = cleanList(body[key], label);
        if (parsed.error) return { error: parsed.error };
        if (!parsed.omitted) updates[key] = parsed.value;
    }
    const social = cleanSocialLinks(body.socialLinks);
    if (social.error) return { error: social.error };
    if (!social.omitted) updates.socialLinks = social.value;
    if (body.visibility !== undefined) {
        const visibility = String(body.visibility).toUpperCase();
        if (!['PUBLIC', 'PRIVATE'].includes(visibility)) return { error: 'Visibility must be PUBLIC or PRIVATE.' };
        updates.visibility = visibility;
    }
    if (body.showCommunityReflections !== undefined) {
        if (typeof body.showCommunityReflections !== 'boolean') return { error: 'showCommunityReflections must be true or false.' };
        updates.showCommunityReflections = body.showCommunityReflections;
    }
    if (!Object.keys(updates).length) return { error: 'No supported profile fields were provided.' };
    return { updates };
}

function profileCreationValues(userId) {
    return { ...PROFILE_DEFAULTS, userId };
}

async function findCreator(userId) {
    return User.findOne({
        where: { accountStatus: 'ACTIVE', id: userId, role: 'CREATOR' },
        include: [
            { model: CreatorProfile, as: 'creatorProfile', required: false },
            { model: UserProfile, as: 'profile', required: false },
        ],
    });
}

function serializeSong(song) {
    return {
        artist: song.artist,
        coverImageUrl: song.coverImageUrl,
        creatorId: song.creatorId,
        description: song.description,
        durationSecs: song.durationSecs,
        id: song.id,
        languages: song.languages || [],
        moodTags: song.moodTags || [],
        publishedDate: song.publishedDate,
        theme: song.theme,
        title: song.title,
    };
}

router.get('/me/profile', requireCreator, async (req, res, next) => {
    try {
        const user = await findCreator(req.authUserRecord.id);
        if (!user) return res.status(404).json({ message: 'Creator profile not found.' });
        return res.json({ profile: editableProfile(user, user.creatorProfile) });
    } catch (error) { return next(error); }
});

router.patch('/me/profile', requireCreator, async (req, res, next) => {
    try {
        const parsed = validateProfile(req.body || {});
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        const user = await findCreator(req.authUserRecord.id);
        const [profile] = await CreatorProfile.findOrCreate({
            defaults: profileCreationValues(user.id),
            where: { userId: user.id },
        });
        const creatorUpdates = { ...parsed.updates };
        const displayName = creatorUpdates.displayName;
        delete creatorUpdates.displayName;
        if (Object.keys(creatorUpdates).length) await profile.update(creatorUpdates);
        let sharedProfile;
        if (displayName) {
            sharedProfile = await findOrCreateProfile(user);
            await sharedProfile.update({ displayName });
            await user.update({ name: displayName });
        }
        return res.json({ message: 'Creator profile updated.', profile: editableProfile(user, profile, sharedProfile || user.profile) });
    } catch (error) { return next(error); }
});

router.post('/me/profile/avatar', requireCreator, avatarUpload.single('avatar'), async (req, res, next) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Choose a JPG, PNG, or WebP image to upload.' });
        const user = await findCreator(req.authUserRecord.id);
        const profile = await findOrCreateProfile(user);
        const previousPublicId = profile.avatarPublicId;
        const uploaded = await uploadImageBuffer(req.file.buffer, { folder: `shades-of-sg/user-avatars/${user.id}` });
        await profile.update({ avatarPublicId: uploaded.public_id, avatarUrl: uploaded.secure_url });
        if (previousPublicId && previousPublicId !== uploaded.public_id) {
            deleteAsset(previousPublicId).catch((error) => console.error('[Creator avatar cleanup]', error.message));
        }
        return res.json({ message: 'Avatar updated.', profile: editableProfile(user, user.creatorProfile, profile) });
    } catch (error) { return next(error); }
});

router.delete('/me/profile/avatar', requireCreator, async (req, res, next) => {
    try {
        const user = await findCreator(req.authUserRecord.id);
        const profile = await UserProfile.findOne({ where: { userId: user.id } });
        if (!profile) return res.json({ message: 'Avatar removed.', profile: editableProfile(user, user.creatorProfile, null) });
        const previousPublicId = profile.avatarPublicId;
        await profile.update({ avatarPublicId: null, avatarUrl: null });
        if (previousPublicId) deleteAsset(previousPublicId).catch((error) => console.error('[Creator avatar cleanup]', error.message));
        return res.json({ message: 'Avatar removed.', profile: editableProfile(user, user.creatorProfile, profile) });
    } catch (error) { return next(error); }
});

router.get('/:creatorId/profile', optionalAuth, async (req, res, next) => {
    try {
        if (!UUID_PATTERN.test(req.params.creatorId)) return res.status(404).json({ message: 'Creator profile not found.' });
        const user = await findCreator(req.params.creatorId);
        if (!user) return res.status(404).json({ message: 'Creator profile not found.' });
        const isOwner = req.authUserRecord?.id === user.id;
        const visibility = user.creatorProfile?.visibility || PROFILE_DEFAULTS.visibility;
        if (visibility === 'PRIVATE' && !isOwner) return res.status(404).json({ message: 'Creator profile not found.' });

        const songs = await Song.findAll({
            where: { creatorId: user.id, status: 'PUBLISHED' },
            order: [['publishedDate', 'DESC'], ['title', 'ASC']],
        });
        const folders = await Folder.findAll({
            where: { status: 'APPROVED' },
            include: [{
                model: Song, as: 'songs', required: true,
                through: { attributes: ['songOrder'] },
                where: { creatorId: user.id, status: 'PUBLISHED' },
            }],
            order: [['displayOrder', 'ASC'], ['name', 'ASC'], [{ model: Song, as: 'songs' }, SongFolder, 'songOrder', 'ASC']],
        });
        const showReflections = user.creatorProfile?.showCommunityReflections ?? PROFILE_DEFAULTS.showCommunityReflections;
        const reflectionResult = showReflections ? await Reflection.findAndCountAll({
            attributes: ['content', 'createdAt', 'displayMode', 'displayName', 'id', 'songId'],
            include: [{
                model: Song, as: 'song', attributes: ['id', 'title'], required: true,
                where: { creatorId: user.id, status: 'PUBLISHED' },
            }],
            limit: 6,
            order: [['createdAt', 'DESC']],
            where: { status: 'APPROVED' },
            distinct: true,
        }) : { count: 0, rows: [] };

        return res.json({
            collections: folders.map((folder) => ({
                description: folder.description,
                id: folder.id,
                name: folder.name,
                slug: folder.slug,
                songs: folder.songs.map(serializeSong),
            })),
            isOwner,
            profile: publicProfile(user, user.creatorProfile),
            reflections: reflectionResult.rows.map((reflection) => ({
                content: reflection.content,
                createdAt: reflection.createdAt,
                displayName: reflection.displayMode === 'ANONYMOUS' ? null : reflection.displayName,
                id: reflection.id,
                isAnonymous: reflection.displayMode === 'ANONYMOUS',
                song: reflection.song,
                songId: reflection.songId,
            })),
            songs: songs.map(serializeSong),
            stats: {
                communityReflections: reflectionResult.count,
                publishedCollections: folders.length,
                publishedSongs: songs.length,
            },
        });
    } catch (error) { return next(error); }
});

module.exports = router;
