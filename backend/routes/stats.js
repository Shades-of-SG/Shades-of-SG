const express = require("express");
const { getStats } = require("../services/statsService");
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get("/", requireAdmin, async (req, res, next) => {
    try {
        const stats = await getStats();
        res.json(stats);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
