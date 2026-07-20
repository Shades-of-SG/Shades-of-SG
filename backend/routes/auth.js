const express = require('express');
const { Op } = require('sequelize');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const {
    createToken,
    hashPassword,
    seedCreatorAccount,
    serializeUser,
    verifyPassword,
} = require('../services/authService');

const router = express.Router();

router.post('/register', async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
        if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
        if (await User.findOne({ where: { email } })) return res.status(409).json({ message: 'An account with this email already exists.' });

        const user = await User.create({ email, name, passwordHash: hashPassword(password) });
        return res.status(201).json({ token: createToken(user), user: serializeUser(user) });
    } catch (error) {
        return next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        await seedCreatorAccount();

        const user = await User.findOne({ where: { email } });

        if (!user || !verifyPassword(password, user.passwordHash)) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        return res.json({
            token: createToken(user),
            user: serializeUser(user),
        });
    } catch (error) {
        return next(error);
    }
});

router.put('/profile', requireAuth, async (req, res, next) => {
    try {
        const name = req.body.name?.trim();
        const email = req.body.email?.trim().toLowerCase();

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required.' });
        }

        const user = await User.findByPk(req.authUser.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });

        const emailOwner = await User.findOne({
            where: { email, id: { [Op.ne]: user.id } },
        });
        if (emailOwner) return res.status(409).json({ message: 'An account with this email already exists.' });

        await user.update({ email, name });
        return res.json({ user: serializeUser(user) });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
