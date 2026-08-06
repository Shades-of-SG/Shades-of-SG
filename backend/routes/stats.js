const express = require("express");
const { getStats, getUserStats } = require("../services/statsService");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const stats = await getStats();
        res.set('Cache-Control', 'no-store');
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

router.get("/me", requireAuth, async (req, res, next) => {
    try {
        const stats = await getUserStats(req.authUser.id);
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
