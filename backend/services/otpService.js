const crypto = require('crypto');
const { Op } = require('sequelize');
const { AuthOtp, User } = require('../models');
const { sendOtpEmail } = require('./emailService');

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function generateOtp() {
    if (process.env.NODE_ENV === 'test' && /^\d{6}$/.test(process.env.OTP_TEST_CODE || '')) return process.env.OTP_TEST_CODE;
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
}

function hashOtp(code, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(String(code), salt, 32).toString('hex');
    return `${salt}$${hash}`;
}

function verifyOtpHash(code, stored) {
    const [salt, expected] = String(stored || '').split('$');
    if (!salt || !expected) return false;
    const actual = crypto.scryptSync(String(code), salt, 32);
    const expectedBuffer = Buffer.from(expected, 'hex');
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

function hashIp(ip) {
    const secret = process.env.OTP_IP_HASH_SECRET || process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET || 'local-dev-otp-ip-secret';
    return crypto.createHmac('sha256', secret).update(String(ip || 'unknown')).digest('hex');
}

function otpError(message, statusCode = 400, code = 'OTP_INVALID') {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
}

async function issueOtp({ email, name, purpose, requestIp, transaction, userId }) {
    const normalizedEmail = normalizeEmail(email);
    const latest = await AuthOtp.findOne({
        where: { email: normalizedEmail, purpose },
        order: [['createdAt', 'DESC']],
        transaction,
    });
    if (latest && Date.now() - new Date(latest.createdAt).getTime() < RESEND_COOLDOWN_MS) {
        const retryAfter = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(latest.createdAt).getTime())) / 1000);
        const error = otpError(`Please wait ${retryAfter} seconds before requesting another code.`, 429, 'OTP_COOLDOWN');
        error.retryAfter = retryAfter;
        throw error;
    }

    const now = new Date();
    await AuthOtp.update({ usedAt: now }, {
        where: { email: normalizedEmail, purpose, usedAt: null }, transaction,
    });
    const code = generateOtp();
    const otp = await AuthOtp.create({
        email: normalizedEmail,
        expiresAt: new Date(now.getTime() + OTP_LIFETIME_MS),
        otpHash: hashOtp(code),
        purpose,
        requestIpHash: hashIp(requestIp),
        userId: userId || null,
    }, { transaction });
    await sendOtpEmail({ code, name, purpose, to: normalizedEmail });
    return otp;
}

async function consumeOtp({ code, email, purpose, transaction }) {
    const normalizedEmail = normalizeEmail(email);
    const otp = await AuthOtp.findOne({
        where: { email: normalizedEmail, purpose, usedAt: null },
        order: [['createdAt', 'DESC']],
        transaction,
    });
    if (!otp) throw otpError('The verification code is invalid or expired.');
    if (new Date(otp.expiresAt).getTime() <= Date.now()) {
        await otp.update({ usedAt: new Date() }, { transaction });
        throw otpError('The verification code has expired.', 400, 'OTP_EXPIRED');
    }
    if (otp.attemptCount >= MAX_ATTEMPTS) {
        await otp.update({ usedAt: new Date() }, { transaction });
        throw otpError('Too many incorrect attempts. Request a new code.', 429, 'OTP_ATTEMPTS_EXCEEDED');
    }
    if (!/^\d{6}$/.test(String(code || '')) || !verifyOtpHash(code, otp.otpHash)) {
        const attemptCount = otp.attemptCount + 1;
        await otp.update({ attemptCount, ...(attemptCount >= MAX_ATTEMPTS ? { usedAt: new Date() } : {}) }, { transaction });
        if (attemptCount >= MAX_ATTEMPTS) throw otpError('Too many incorrect attempts. Request a new code.', 429, 'OTP_ATTEMPTS_EXCEEDED');
        throw otpError('The verification code is invalid or expired.');
    }
    await otp.update({ usedAt: new Date() }, { transaction });
    const user = otp.userId ? await User.findByPk(otp.userId, { transaction }) : null;
    return { otp, user };
}

async function invalidateOtps({ email, purpose, transaction }) {
    return AuthOtp.update({ usedAt: new Date() }, { where: { email: normalizeEmail(email), purpose, usedAt: { [Op.is]: null } }, transaction });
}

module.exports = {
    consumeOtp,
    invalidateOtps,
    issueOtp,
    MAX_ATTEMPTS,
    normalizeEmail,
    OTP_LIFETIME_MS,
    RESEND_COOLDOWN_MS,
};
