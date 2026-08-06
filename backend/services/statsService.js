const { Op } = require('sequelize');
const { User, Song, Reflection } = require('../models');

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

module.exports = { getStats };
