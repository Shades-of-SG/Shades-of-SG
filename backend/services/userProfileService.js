const { fn, col, Op } = require('sequelize');
const {
    Badge, GameScore, Reflection, Song, User, UserProfile,
} = require('../models');

const DEFAULTS = Object.freeze({
    bio: '', fontSize: 'MEDIUM', location: '', preferredLanguage: '',
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

async function rhythmSummary(userId) {
    const [recentScores, gamesPlayed, bestScoreValue, grouped] = await Promise.all([
        GameScore.findAll({
            attributes: ['id', 'songId', 'score', 'accuracy', 'difficulty', 'rank', 'createdAt'],
            include: [{ model: Song, as: 'song', attributes: ['id', 'title', 'coverImageUrl'], required: false }],
            limit: 10, order: [['createdAt', 'DESC']], where: { userId },
        }),
        GameScore.count({ where: { userId, score: { [Op.gte]: 0 } } }),
        GameScore.max('score', { where: { userId, score: { [Op.gte]: 0 } } }),
        GameScore.findAll({
            attributes: ['userId', [fn('MAX', col('score')), 'bestScore']],
            group: ['userId'], raw: true,
            where: { score: { [Op.gte]: 0 }, userId: { [Op.ne]: null } },
        }),
    ]);

    const activeUsers = await User.findAll({
        attributes: ['id'],
        where: { accountStatus: 'ACTIVE', id: { [Op.in]: grouped.map((row) => row.userId) }, role: { [Op.in]: ['REGISTERED', 'CREATOR'] } },
    });
    const activeIds = new Set(activeUsers.map((user) => user.id));
    const scores = grouped.filter((row) => activeIds.has(row.userId)).map((row) => Number(row.bestScore));
    const bestScore = Number(bestScoreValue) || 0;
    const rank = gamesPlayed ? 1 + new Set(scores.filter((score) => score > bestScore)).size : null;

    return { bestScore, gamesPlayed, rank, recentScores };
}

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
