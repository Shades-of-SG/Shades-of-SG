const {
    Badge, Reflection, Song, UserProfile,
} = require('../models');
const { userRhythmSummary } = require('./rhythmRankingService');
const { ALLOWED_INTEREST_TAGS } = require('./profileInterests');

const DEFAULTS = Object.freeze({
    bio: '', fontSize: 'MEDIUM', location: '', preferredLanguage: '',
    interestTags: [],
    profileVisibility: 'PUBLIC', reducedMotion: false, showBadges: true,
    showReflections: true, showRhythmRanking: true, theme: 'SYSTEM',
});

function profileValues(user, storedProfile) {
    const value = storedProfile?.get ? storedProfile.get({ plain: true }) : storedProfile || {};
    return {
        avatarUrl: value.avatarUrl || '',
        bio: value.bio ?? DEFAULTS.bio,
        displayName: value.displayName || user.name,
        fontSize: value.fontSize || DEFAULTS.fontSize,
        interestTags: Array.isArray(value.interestTags)
            ? value.interestTags.filter((tag) => ALLOWED_INTEREST_TAGS.has(tag))
            : DEFAULTS.interestTags,
        location: value.location ?? DEFAULTS.location,
        preferredLanguage: value.preferredLanguage ?? DEFAULTS.preferredLanguage,
        profileVisibility: value.profileVisibility || DEFAULTS.profileVisibility,
        reducedMotion: value.reducedMotion ?? DEFAULTS.reducedMotion,
        showBadges: value.showBadges ?? DEFAULTS.showBadges,
        showReflections: value.showReflections ?? DEFAULTS.showReflections,
        showRhythmRanking: value.showRhythmRanking ?? DEFAULTS.showRhythmRanking,
        theme: value.theme || DEFAULTS.theme,
        updatedAt: value.updatedAt || user.updatedAt,
    };
}

function publicIdentity(user, storedProfile) {
    const profile = profileValues(user, storedProfile);
    return {
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        createdAt: user.createdAt,
        displayName: profile.displayName,
        interestTags: profile.interestTags,
        isCreator: user.role === 'CREATOR',
        location: profile.location,
        userId: user.id,
    };
}

async function findOrCreateProfile(user, transaction) {
    const [profile] = await UserProfile.findOrCreate({
        defaults: { displayName: user.name.slice(0, 80), userId: user.id },
        transaction,
        where: { userId: user.id },
    });
    return profile;
}

const rhythmSummary = userRhythmSummary;

async function activityFor(userId, { publicView = false, profile } = {}) {
    const includeBadges = !publicView || profile.showBadges;
    const includeReflections = !publicView || profile.showReflections;
    const includeRhythm = !publicView || profile.showRhythmRanking;
    const [badges, reflections, rhythm] = await Promise.all([
        includeBadges ? Badge.findAll({ where: { userId }, order: [['earnedAt', 'DESC']] }) : Promise.resolve([]),
        includeReflections ? Reflection.findAll({
            attributes: ['id', 'content', 'displayMode', 'displayName', 'songId', 'status', 'tags', 'createdAt'],
            include: [{ model: Song, as: 'song', attributes: ['id', 'title'], required: publicView, ...(publicView ? { where: { status: 'PUBLISHED' } } : {}) }],
            limit: 12, order: [['createdAt', 'DESC']],
            where: publicView ? { displayMode: 'PROFILE', status: 'APPROVED', userId } : { userId },
        }) : Promise.resolve([]),
        includeRhythm ? rhythmSummary(userId) : Promise.resolve(null),
    ]);
    return {
        badges, reflections, rhythm,
        visibleSections: { badges: includeBadges, reflections: includeReflections, rhythm: includeRhythm },
    };
}

module.exports = { DEFAULTS, activityFor, findOrCreateProfile, profileValues, publicIdentity, rhythmSummary };
