const { User, Song, Reflection, Badge, TriviaAttempt, GameScore } = require('../models');

async function getStats() {
    const [usersCount, songsCount, reflectionsCount] = await Promise.all([
        User.count({ where: { role: 'REGISTERED' } }),
        Song.count({ where: { status: 'PUBLISHED' } }),
        Reflection.count({ where: { status: 'APPROVED' } }),
    ]);

    return { usersCount, songsCount, reflectionsCount };
}

async function getUserStats(userId) {
    const [badgesCount, triviaAttemptsCount, gamePlaysCount] = await Promise.all([
        Badge.count({ where: { userId } }),
        TriviaAttempt.count({ where: { userId } }),
        GameScore.count({ where: { userId } }),
    ]);

    return { badgesCount, triviaAttemptsCount, gamePlaysCount };
}

module.exports = { getStats, getUserStats };
