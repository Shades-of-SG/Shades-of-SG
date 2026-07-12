const { User, Song, Reflection } = require("../models");

async function getStats() {
    const usersCount = await User.count({
        where: { role: "REGISTERED" } // adjust if your user table uses a different field
    });

    const songsCount = await Song.count();

    const reflectionsCount = await Reflection.count({
        where: { status: "APPROVED" } // exclude pending
    });

    return { usersCount, songsCount, reflectionsCount };
}

module.exports = { getStats };
