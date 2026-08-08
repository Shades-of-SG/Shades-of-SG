const { Badge, BadgeDefinition, InstrumentChallengeProgress, Reflection, SongExploration, User } = require('../models');
const { BADGE_CATALOG } = require('./badgeCatalog');

async function evaluateAndAward(userId, { transaction } = {}) {
    const user = await User.findByPk(userId, { attributes: ['currentLoginStreak'], transaction });
    if (!user) return [];
    const reflectionCount = await Reflection.count({ transaction, where: { userId } });
    const instrumentChallengesCompleted = await InstrumentChallengeProgress.count({ transaction, where: { userId } });
    const songsExploredCount = await SongExploration.count({ transaction, where: { userId } });

    const metrics = {
        instrumentChallengesCompleted, loginStreak: user.currentLoginStreak, reflectionCount, songsExploredCount,
    };
    const eligible = BADGE_CATALOG.filter((badge) => badge.isEarned(metrics));

    const awarded = [];
    for (const badge of eligible) {
        // Description comes from the badge_definitions catalog table (single source of truth
        // for display metadata) rather than being duplicated in badgeCatalog.js.
        const definition = await BadgeDefinition.findOne({ transaction, where: { name: badge.name } });
        const [awardedBadge, created] = await Badge.findOrCreate({
            defaults: { description: definition ? definition.description : null, name: badge.name, userId },
            transaction,
            where: { name: badge.name, userId },
        });
        if (created) awarded.push(awardedBadge);
    }
    return awarded;
}

module.exports = { evaluateAndAward };
