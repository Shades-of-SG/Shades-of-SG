const { User, Song, Reflection } = require('../models');

async function getStats() {
    const [usersCount, songsCount, reflectionsCount] = await Promise.all([
        User.count({ where: { role: 'REGISTERED' } }),
        Song.count({ where: { status: 'PUBLISHED' } }),
        Reflection.count({ where: { status: 'APPROVED' } }),
    ]);

    return { usersCount, songsCount, reflectionsCount };
}

module.exports = { getStats };
