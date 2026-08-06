const express = require('express');
const { Badge, BadgeDefinition, User } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// The full badge catalog (name, description, category, sticker art) — used by the frontend to
// render locked/unlocked stickers without duplicating this metadata in its own JS.
router.get('/catalog', requireAuth, async (req, res, next) => {
    try {
        const definitions = await BadgeDefinition.findAll({ order: [['sortOrder', 'ASC']] });
        return res.json({ definitions });
    } catch (error) { return next(error); }
});

router.get('/:userId', requireAuth, async (req, res, next) => {
    try {
        const currentUser = await User.findByPk(req.authUser.id, { attributes: ['id', 'role'] });
        if (!currentUser) return res.status(401).json({ message: 'Your account could not be found.' });
        if (!['REGISTERED', 'CREATOR'].includes(currentUser.role) || req.params.userId !== currentUser.id) {
            return res.status(403).json({ message: 'You can only view your own badges.' });
        }
        const badges = await Badge.findAll({ where: { userId: currentUser.id }, order: [['earnedAt', 'DESC']] });
        return res.json({ badges });
    } catch (error) { return next(error); }
});

module.exports = router;
