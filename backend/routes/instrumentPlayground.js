const express = require('express');
const { sequelize, InstrumentChallengeProgress } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { evaluateAndAward } = require('../services/badgeAwardService');
const { INSTRUMENT_CHALLENGE_IDS } = require('../services/badgeCatalog');

const router = express.Router();

// Lets the frontend restore which challenges are already done on load/refresh, instead of
// re-deriving completion purely from in-session note presses (which reset on every reload).
router.get('/challenges/progress', requireAuth, async (req, res, next) => {
    try {
        const progress = await InstrumentChallengeProgress.findAll({
            attributes: ['challengeId'],
            where: { userId: req.authUserRecord.id },
        });
        return res.json({ completedChallengeIds: progress.map((row) => row.challengeId) });
    } catch (error) { return next(error); }
});

router.post('/challenges/:challengeId/complete', requireAuth, async (req, res, next) => {
    try {
        const { challengeId } = req.params;
        if (!INSTRUMENT_CHALLENGE_IDS.includes(challengeId)) {
            return res.status(400).json({ message: 'Unknown challenge id.' });
        }

        await sequelize.transaction(async (transaction) => {
            await InstrumentChallengeProgress.findOrCreate({
                transaction,
                where: { challengeId, userId: req.authUserRecord.id },
            });
            await evaluateAndAward(req.authUserRecord.id, { transaction });
        });

        return res.status(202).json({ accepted: true });
    } catch (error) { return next(error); }
});

module.exports = router;
