const express = require('express');
const User = require('../models/User');
const {
    createToken,
    seedCreatorAccount,
    serializeUser,
    verifyPassword,
} = require('../services/authService');

const router = express.Router();

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

module.exports = router;
