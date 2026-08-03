const sequelize = require('../config/database');
const { evaluateAndAward } = require('./badgeAwardService');

function todayDateOnly() {
    return new Date().toISOString().slice(0, 10);
}

async function recordDailyActivity(user) {
    const today = todayDateOnly();
    if (user.lastActiveDate === today) return;

    const isConsecutiveDay = user.lastActiveDate
        && new Date(today) - new Date(user.lastActiveDate) === 24 * 60 * 60 * 1000;
    const currentLoginStreak = isConsecutiveDay ? user.currentLoginStreak + 1 : 1;
    const longestLoginStreak = Math.max(user.longestLoginStreak, currentLoginStreak);

    await sequelize.transaction(async (transaction) => {
        await user.update({ currentLoginStreak, lastActiveDate: today, longestLoginStreak }, { transaction });
        await evaluateAndAward(user.id, { transaction });
    });
}

module.exports = { recordDailyActivity };
