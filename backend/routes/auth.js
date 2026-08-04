const crypto = require('crypto');
const express = require('express');
const { performance } = require('perf_hooks');
const { Op, UniqueConstraintError } = require('sequelize');
const { sequelize, User, UserProfile } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { authRateKey, createRateLimit } = require('../middleware/rateLimit');
const {
    accountSuspensionMessage, createScopedToken, createToken, hashPassword, hashPasswordAsync, serializeUser,
    verifyPassword, verifyScopedToken,
} = require('../services/authService');
const { consumeOtp, invalidateOtps, issueOtp, normalizeEmail } = require('../services/otpService');
const { recordDailyActivity } = require('../services/streakService');
const {
    createOauthChallenge, finishOauthSignIn, publicOauthConfig,
    verifyAppleCredential, verifyGoogleCredential,
} = require('../services/oauthService');

const router = express.Router();
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const requestLimit = createRateLimit({ key: authRateKey('otp-request'), max: 5, windowMs: 15 * 60 * 1000 });
const verifyLimit = createRateLimit({ key: authRateKey('otp-verify'), max: 10, windowMs: 10 * 60 * 1000 });
const loginLimit = createRateLimit({ key: authRateKey('login'), max: 10, windowMs: 10 * 60 * 1000 });
const oauthLimit = createRateLimit({ key: (req) => `oauth:ip:${req.ip}`, max: 30, windowMs: 10 * 60 * 1000 });

function validPassword(password) {
    return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

const STRONG_PASSWORD_MESSAGE = 'Password must be 8-128 characters and include an uppercase letter, a lowercase letter, a number, and a special character.';
function validStrongPassword(password) {
    return validPassword(password)
        && /[a-z]/.test(password)
        && /[A-Z]/.test(password)
        && /\d/.test(password)
        && /[^A-Za-z0-9]/.test(password);
}

function validName(name) {
    return typeof name === 'string' && name.trim().length >= 2 && name.trim().length <= 255;
}

function createRegistrationTiming() {
    const enabled = process.env.NODE_ENV !== 'test' || process.env.REGISTRATION_TIMING_LOGS === 'true';
    const requestId = crypto.randomUUID();
    const startedAt = performance.now();
    let stageStartedAt = startedAt;

    function write(stage, details = {}) {
        const now = performance.now();
        if (enabled) {
            console.info('[Registration timing]', JSON.stringify({
                durationMs: Math.round(now - stageStartedAt),
                requestId,
                stage,
                totalMs: Math.round(now - startedAt),
                ...details,
            }));
        }
        stageStartedAt = now;
    }

    return { write };
}

function rejectRegistration(timing, res, statusCode, message, reason) {
    timing.write('request_rejected', { reason, statusCode });
    return res.status(statusCode).json({ message });
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
    const timing = createRegistrationTiming();
    timing.write('request_received');
    try {
        const name = String(req.body.name || '').trim();
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;
        if (!validName(name)) return rejectRegistration(timing, res, 400, 'Full name must be between 2 and 255 characters.', 'invalid_name');
        if (!EMAIL_PATTERN.test(email)) return rejectRegistration(timing, res, 400, 'Enter a valid email address.', 'invalid_email');
        if (!validStrongPassword(password)) return rejectRegistration(timing, res, 400, STRONG_PASSWORD_MESSAGE, 'invalid_password');
        if (req.body.acceptTerms !== true || req.body.acceptPrivacy !== true) {
            return rejectRegistration(timing, res, 400, 'You must accept the Terms of Use and Privacy Policy.', 'agreements_missing');
        }
        timing.write('validation');
        if (await User.findOne({ where: { email } })) {
            timing.write('duplicate_lookup');
            return rejectRegistration(timing, res, 409, 'This email cannot be used. Continue to sign in or recover your account.', 'duplicate_email');
        }
        timing.write('duplicate_lookup');

        const passwordHash = await hashPasswordAsync(password);
        timing.write('password_hash');

        let user;
        await sequelize.transaction(async (transaction) => {
            user = await User.create({
                email,
                emailVerificationRequired: true,
                name,
                passwordHash,
                role: 'REGISTERED',
            }, { transaction });
            timing.write('user_record_created');
            await issueOtp({
                email,
                name,
                onStage: (stage) => timing.write(stage),
                purpose: 'REGISTRATION',
                requestIp: req.ip,
                transaction,
                userId: user.id,
            });
        });
        timing.write('transaction_committed');
        timing.write('response_sent', { statusCode: 201 });
        return res.status(201).json({
            email,
            message: 'Account created. Enter the six-digit code sent to your email.',
            resendCooldownSeconds: 60,
        });
    } catch (error) {
        if (error instanceof UniqueConstraintError) {
            return rejectRegistration(timing, res, 409, 'This email cannot be used. Continue to sign in or recover your account.', 'duplicate_email_race');
        }
        timing.write('request_failed', {
            errorCode: String(error.cause?.code || error.code || 'UNEXPECTED').slice(0, 64),
            errorType: String(error.name || 'Error').slice(0, 64),
            statusCode: error.statusCode || error.status || 500,
        });
        return next(error);
    }
});

router.post('/verify-email', verifyLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const { user } = await processOtp({ code: req.body.code, email, purpose: 'REGISTRATION' }, async ({ user: pendingUser }, transaction) => {
            if (!pendingUser || pendingUser.email !== email || !pendingUser.emailVerificationRequired) {
                const error = new Error('The verification code is invalid or expired.');
                error.statusCode = 400;
                throw error;
            }
            await pendingUser.update({ emailVerificationRequired: false, emailVerifiedAt: new Date() }, { transaction });
        });
        return res.json({
            message: 'Email verified successfully. You are now signed in.',
            token: createToken(user),
            user: serializeUser(user),
        });
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

router.post('/login', loginLimit, async (req, res, next) => {
    try {
        const email = normalizeEmail(req.body.email);
        const password = req.body.password;
        if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
        if (!validPassword(password)) return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
        const user = await User.findOne({ include: [{ model: UserProfile, as: 'profile', required: false }], where: { email } });
        if (!user || !verifyPassword(password, user.passwordHash)) return res.status(401).json({ message: 'Invalid email or password.' });
        if (user.accountStatus !== 'ACTIVE') return res.status(403).json({ code: 'ACCOUNT_SUSPENDED', message: accountSuspensionMessage(user), reason: user.accountSuspensionReason });
        if (user.emailVerificationRequired) return res.status(403).json({ code: 'EMAIL_UNVERIFIED', message: 'Verify your email before signing in.' });
        await recordDailyActivity(user);
        return res.json({ token: createToken(user), user: serializeUser(user) });
    } catch (error) { return next(error); }
});

router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await User.findByPk(req.authUserRecord.id, { include: [{ model: UserProfile, as: 'profile', required: false }] });
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        return res.json({ user: serializeUser(user) });
    } catch (error) { return next(error); }
});

router.post('/password-reset/request', requestLimit, async (req, res, next) => {
    const email = normalizeEmail(req.body.email);
    const generic = { message: 'If an eligible account exists, a password-reset code will be sent.', resendCooldownSeconds: 60 };
    try {
        const user = await User.findOne({ where: { accountStatus: 'ACTIVE', email, emailVerificationRequired: false } });
        if (user) {
            await sequelize.transaction((transaction) => issueOtp({ email, name: user.name, purpose: 'PASSWORD_RESET', requestIp: req.ip, transaction, userId: user.id }));
        }
    } catch (error) {
        // A cooldown hit means this email already had a code issued in this flow, so it's safe to
        // surface truthfully. Any other error stays enumeration-safe behind the generic response.
        if (error.code === 'OTP_COOLDOWN') return next(error);
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
        if (!validStrongPassword(password)) return res.status(400).json({ message: STRONG_PASSWORD_MESSAGE });
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

router.post('/email-change/request', requireAuth, requestLimit, async (req, res, next) => {
    try {
        const password = req.body.password;
        const newEmail = normalizeEmail(req.body.newEmail);
        const user = await User.findByPk(req.authUserRecord.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ message: 'Incorrect password.' });
        if (!EMAIL_PATTERN.test(newEmail)) return res.status(400).json({ message: 'Enter a valid email address.' });
        if (newEmail === user.email) return res.status(400).json({ message: 'Enter an email address different from your current one.' });
        const emailOwner = await User.findOne({ where: { email: newEmail, id: { [Op.ne]: user.id } } });
        if (emailOwner) return res.status(409).json({ message: 'An account with this email already exists.' });
        await sequelize.transaction((transaction) => issueOtp({
            email: newEmail, name: user.name, purpose: 'EMAIL_CHANGE', requestIp: req.ip, transaction, userId: user.id,
        }));
        return res.status(202).json({ message: 'A verification code has been sent to the new email address.', resendCooldownSeconds: 60 });
    } catch (error) { return next(error); }
});

router.post('/email-change/verify', requireAuth, verifyLimit, async (req, res, next) => {
    try {
        const newEmail = normalizeEmail(req.body.newEmail);
        const user = await User.findByPk(req.authUserRecord.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        const { otp } = await processOtp({ code: req.body.code, email: newEmail, purpose: 'EMAIL_CHANGE' }, async () => {});
        if (otp.userId !== user.id) {
            const error = new Error('The verification code is invalid or expired.');
            error.statusCode = 400;
            throw error;
        }
        const changeToken = createScopedToken({ newEmail, purpose: 'EMAIL_CHANGE', userId: user.id, version: user.authVersion });
        return res.json({ changeToken });
    } catch (error) { return next(error); }
});

router.post('/email-change/complete', requireAuth, async (req, res, next) => {
    try {
        const payload = verifyScopedToken(req.body.changeToken, 'EMAIL_CHANGE');
        if (!payload || payload.userId !== req.authUserRecord.id) {
            return res.status(400).json({ message: 'The email-change session is invalid or expired.' });
        }
        const user = await User.findByPk(payload.userId);
        if (!user || Number(user.authVersion || 0) !== Number(payload.ver || 0) || user.accountStatus !== 'ACTIVE') {
            return res.status(400).json({ message: 'The email-change session is invalid or expired.' });
        }
        const newEmail = normalizeEmail(payload.newEmail);
        const emailOwner = await User.findOne({ where: { email: newEmail, id: { [Op.ne]: user.id } } });
        if (emailOwner) return res.status(409).json({ message: 'An account with this email already exists.' });
        await sequelize.transaction(async (transaction) => {
            await user.update({
                authVersion: Number(user.authVersion || 0) + 1, email: newEmail, emailVerificationRequired: false,
            }, { transaction });
            await invalidateOtps({ email: newEmail, purpose: 'EMAIL_CHANGE', transaction });
        });
        return res.json({ message: 'Email updated successfully. Please sign in again.' });
    } catch (error) { return next(error); }
});

router.delete('/account', requireAuth, async (req, res, next) => {
    try {
        const password = req.body.password;
        const user = await User.findByPk(req.authUserRecord.id);
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        if (!verifyPassword(password, user.passwordHash)) return res.status(401).json({ message: 'Incorrect password.' });
        await user.update({
            accountStatus: 'DELETED', authVersion: Number(user.authVersion || 0) + 1, deletedAt: new Date(),
        });
        return res.json({ message: 'Account deleted.' });
    } catch (error) { return next(error); }
});

module.exports = router;
