const express = require('express');
const { Op, UniqueConstraintError } = require('sequelize');
const { sequelize, User } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { authRateKey, createRateLimit } = require('../middleware/rateLimit');
const {
    createScopedToken, createToken, hashPassword, serializeUser,
    verifyPassword, verifyScopedToken,
} = require('../services/authService');
const { consumeOtp, invalidateOtps, issueOtp, normalizeEmail } = require('../services/otpService');
const {
    createOauthChallenge, finishOauthSignIn, publicOauthConfig,
    verifyAppleCredential, verifyGoogleCredential,
} = require('../services/oauthService');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestLimit = createRateLimit({ key: authRateKey('otp-request'), max: 5, windowMs: 15 * 60 * 1000 });
const verifyLimit = createRateLimit({ key: authRateKey('otp-verify'), max: 10, windowMs: 10 * 60 * 1000 });
const oauthLimit = createRateLimit({ key: (req) => `oauth:ip:${req.ip}`, max: 30, windowMs: 10 * 60 * 1000 });

function validPassword(password) {
    return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function validName(name) {
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 255;
}

async function processOtp(values, onSuccess) {
    let result;
    let verificationError;
    await sequelize.transaction(async (transaction) => {
        try {
            result = await consumeOtp({ ...values, transaction });
        } catch (error) {
            // Commit attempt/expiry state before returning the safe verification error.
            verificationError = error;
            return;
        }
        await onSuccess(result, transaction);
    });
    if (verificationError) throw verificationError;
    return result;
}

router.get('/config', (req, res) => res.json(publicOauthConfig()));

router.post('/oauth/challenge', oauthLimit, (req, res, next) => {
    try {
        return res.json(createOauthChallenge(req.body.provider));
    } catch (error) { return next(error); }
});

router.post('/oauth/google', oauthLimit, async (req, res, next) => {
    try {
        const identity = await verifyGoogleCredential(req.body);
        return res.json(await finishOauthSignIn(identity));
    } catch (error) { return next(error); }
});

router.post('/oauth/apple', oauthLimit, async (req, res, next) => {
    try {
        const identity = await verifyAppleCredential(req.body);
        return res.json(await finishOauthSignIn(identity));
    } catch (error) { return next(error); }
});

router.post('/register', requestLimit, async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;
        if (!validName(name)) return res.status(400).json({ message: 'Full name must be between 2 and 255 characters.' });
        if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
        if (!validPassword(password)) return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
        if (req.body.acceptTerms !== true || req.body.acceptPrivacy !== true) {
            return res.status(400).json({ message: 'You must accept the Terms of Use and Privacy Policy.' });
        }
        if (await User.findOne({ where: { email } })) return res.status(409).json({ message: 'An account with this email already exists.' });

        let user;
        await sequelize.transaction(async (transaction) => {
            user = await User.create({
                email,
                emailVerificationRequired: true,
                name,
                passwordHash: hashPassword(password),
                role: 'REGISTERED',
            }, { transaction });
            await issueOtp({ email, name, purpose: 'REGISTRATION', requestIp: req.ip, transaction, userId: user.id });
        });
        return res.status(201).json({
            email,
            message: 'Account created. Enter the six-digit code sent to your email.',
            resendCooldownSeconds: 60,
        });
    } catch (error) {
        if (error instanceof UniqueConstraintError) return res.status(409).json({ message: 'An account with this email already exists.' });
        return next(error);
    }
});

router.post('/verify-email', verifyLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        await processOtp({ code: req.body.code, email, purpose: 'REGISTRATION' }, async ({ user }, transaction) => {
            if (!user || user.email !== email || !user.emailVerificationRequired) {
                const error = new Error('The verification code is invalid or expired.');
                error.statusCode = 400;
                throw error;
            }
            await user.update({ emailVerificationRequired: false, emailVerifiedAt: new Date() }, { transaction });
        });
        return res.json({ message: 'Email verified successfully. You can now sign in.' });
    } catch (error) { return next(error); }
});

router.post('/resend-verification', requestLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const user = await User.findOne({ where: { email, emailVerificationRequired: true } });
        if (!user) return res.status(202).json({ message: 'If verification is pending, a new code will be sent.' });
        await sequelize.transaction((transaction) => issueOtp({ email, name: user.name, purpose: 'REGISTRATION', requestIp: req.ip, transaction, userId: user.id }));
        return res.status(202).json({ message: 'A new verification code has been sent.', resendCooldownSeconds: 60 });
    } catch (error) { return next(error); }
});

router.post('/login', async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });
        const user = await User.findOne({ where: { email } });
        if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ message: 'Invalid email or password.' });
        if (user.accountStatus !== 'ACTIVE') return res.status(403).json({ message: 'This account is suspended. Contact support if you believe this is a mistake.' });
        if (user.emailVerificationRequired) return res.status(403).json({ code: 'EMAIL_UNVERIFIED', message: 'Verify your email before signing in.' });
        return res.json({ token: createToken(user), user: serializeUser(user) });
    } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await User.findByPk(req.authUserRecord.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        return res.json({ user: serializeUser(user) });
    } catch (error) { return next(error); }
});

router.post('/password-reset/request', requestLimit, async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const generic = { message: 'If an eligible account exists, a password-reset code will be sent.' };
    try {
        const user = await User.findOne({ where: { accountStatus: 'ACTIVE', email, emailVerificationRequired: false } });
        if (user) {
            await sequelize.transaction((transaction) => issueOtp({ email, name: user.name, purpose: 'PASSWORD_RESET', requestIp: req.ip, transaction, userId: user.id }));
        }
    } catch (error) {
        // Recovery remains enumeration-safe. Operational details stay server-side without secrets or codes.
        console.error('[Password reset delivery]', error.message);
    }
    return res.status(202).json(generic);
});

router.post('/password-reset/verify', verifyLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { user } = await processOtp({ code: req.body.code, email, purpose: 'PASSWORD_RESET' }, async ({ user: matchedUser }) => {
            if (!matchedUser || matchedUser.email !== email || matchedUser.accountStatus !== 'ACTIVE') {
                const error = new Error('The verification code is invalid or expired.');
                error.statusCode = 400;
                throw error;
            }
        });
        return res.json({ resetToken: createScopedToken({ purpose: 'PASSWORD_RESET', userId: user.id, version: user.authVersion }) });
    } catch (error) { return next(error); }
});

router.post('/password-reset/complete', async (req, res, next) => {
    try {
        const password = req.body.password;
        if (!validPassword(password)) return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
        const payload = verifyScopedToken(req.body.resetToken, 'PASSWORD_RESET');
        if (!payload) return res.status(400).json({ message: 'The password-reset session is invalid or expired.' });
        const user = await User.findByPk(payload.userId);
        if (!user || Number(user.authVersion || 0) !== Number(payload.ver || 0) || user.accountStatus !== 'ACTIVE') {
            return res.status(400).json({ message: 'The password-reset session is invalid or expired.' });
        }
        await sequelize.transaction(async (transaction) => {
            await user.update({ authVersion: Number(user.authVersion || 0) + 1, passwordHash: hashPassword(password) }, { transaction });
            await invalidateOtps({ email: user.email, purpose: 'PASSWORD_RESET', transaction });
        });
        return res.json({ message: 'Password updated successfully. Sign in with your new password.' });
    } catch (error) { return next(error); }
});

router.put('/profile', requireAuth, async (req, res, next) => {
    try {
        const name = String(req.body.name || '').trim();
        const email = normalizeEmail(req.body.email);
        if (!validName(name) || !EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'A valid name and email are required.' });
        const user = await User.findByPk(req.authUserRecord.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        if (email !== user.email) {
            const emailOwner = await User.findOne({ where: { email, id: { [Op.ne]: user.id } } });
            if (emailOwner) return res.status(409).json({ message: 'An account with this email already exists.' });
            return res.status(400).json({ message: 'Email changes require verification and are not available from this form yet.' });
        }
        await user.update({ name });
        return res.json({ user: serializeUser(user) });
    } catch (error) { return next(error); }
});

module.exports = router;
