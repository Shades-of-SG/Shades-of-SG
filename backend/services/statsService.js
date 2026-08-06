const { User, Song, Reflection, Badge, TriviaAttempt, GameScore } = require('../models');
const { Op } = require('sequelize');

async function getStats() {
    const [usersCount, songsCount, reflectionsCount] = await Promise.all([
        User.count({ where: { role: 'REGISTERED' } }),
        Song.count({
            where: {
                creatorId: { [Op.ne]: null },
                status: 'PUBLISHED',
                title: { [Op.ne]: 'Beatmap Song' },
            },
        }),
        Reflection.count({
            where: { status: 'APPROVED' },
            include: [{
                model: Song,
                as: 'song',
                attributes: [],
                required: true,
                where: {
                    creatorId: { [Op.ne]: null },
                    status: 'PUBLISHED',
                },
            }],
        }),
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
