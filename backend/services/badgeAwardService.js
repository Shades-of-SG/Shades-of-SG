const { Badge, InstrumentChallengeProgress, Reflection, User } = require('../models');
const { BADGE_CATALOG } = require('./badgeCatalog');

async function evaluateAndAward(userId, { transaction } = {}) {
    const user = await User.findByPk(userId, { attributes: ['currentLoginStreak'], transaction });
    if (!user) return [];
    const reflectionCount = await Reflection.count({ transaction, where: { userId } });
    const instrumentChallengesCompleted = await InstrumentChallengeProgress.count({ transaction, where: { userId } });

    const metrics = { instrumentChallengesCompleted, loginStreak: user.currentLoginStreak, reflectionCount };
    const eligible = BADGE_CATALOG.filter((badge) => badge.isEarned(metrics));

    const awarded = [];
    for (const badge of eligible) {
        const [awardedBadge, created] = await Badge.findOrCreate({
            defaults: { description: badge.description, name: badge.name, userId },
            transaction,
            where: { name: badge.name, userId },
        });
        if (created) awarded.push(awardedBadge);
    }
    return awarded;
}

module.exports = { evaluateAndAward };
