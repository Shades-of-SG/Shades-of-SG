const express = require("express");
const { getStats } = require("../services/statsService");
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get("/", requireAdmin, async (req, res, next) => {
    try {
        const stats = await getStats();
        res.set('Cache-Control', 'no-store');
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
