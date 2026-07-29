const crypto = require('crypto');
const User = require('../models/User');

const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';

function getTokenSecret() {
    const secret = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;
    if (secret) return secret;
    if (process.env.NODE_ENV === 'production') {
        throw new Error('AUTH_TOKEN_SECRET or JWT_SECRET is required in production.');
    }
    return 'local-dev-auth-secret';
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto
        .pbkdf2Sync(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
        .toString('hex');

    return `pbkdf2$${HASH_ITERATIONS}$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
    const [algorithm, iterations, salt, hash] = String(storedHash || '').split('$');
    const iterationCount = Number(iterations);

    if (algorithm !== 'pbkdf2' || !Number.isInteger(iterationCount) || iterationCount < 1 || iterationCount > 1000000 || !salt || !/^[0-9a-f]+$/i.test(hash || '')) {
        return false;
    }

    const nextHash = crypto
        .pbkdf2Sync(password, salt, iterationCount, HASH_KEY_LENGTH, HASH_DIGEST)
        .toString('hex');
    const storedBuffer = Buffer.from(hash, 'hex');
    const nextBuffer = Buffer.from(nextHash, 'hex');
    return storedBuffer.length === nextBuffer.length && crypto.timingSafeEqual(storedBuffer, nextBuffer);
}

function signPayload(values) {
    const secret = getTokenSecret();
    const payload = Buffer.from(JSON.stringify(values)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}

function readSignedPayload(token) {
    if (!token || typeof token !== 'string') {
        return null;
    }

    const [payload, signature, extra] = token.split('.');

    if (!payload || !signature || extra) {
        return null;
    }

    const secret = getTokenSecret();
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);

    if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
        return null;
    }

    try {
        const values = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!Number.isFinite(values.exp) || values.exp <= Math.floor(Date.now() / 1000)) return null;
        return values;
    } catch {
        return null;
    }
}

function createToken(user) {
    const now = Math.floor(Date.now() / 1000);
    const lifetime = Math.min(Math.max(Number(process.env.AUTH_TOKEN_TTL_SECONDS) || 3600, 300), 86400);
    return signPayload({
        email: user.email,
        exp: now + lifetime,
        iat: now,
        id: user.id,
        role: user.role,
        ver: Number(user.authVersion || 0),
    });
}

function verifyToken(token) {
    const payload = readSignedPayload(token);
    return payload?.id && !payload.purpose ? payload : null;
}

function createScopedToken({ purpose, userId, version }, lifetimeSeconds = 600) {
    const now = Math.floor(Date.now() / 1000);
    return signPayload({ exp: now + lifetimeSeconds, iat: now, purpose, userId, ver: Number(version || 0) });
}

function verifyScopedToken(token, purpose) {
    const payload = readSignedPayload(token);
    return payload?.purpose === purpose && payload.userId ? payload : null;
}

function serializeUser(user) {
    return {
        createdAt: user.createdAt,
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
        accountStatus: user.accountStatus,
        emailVerified: !user.emailVerificationRequired,
    };
}

async function seedAdminAccount() {
    const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SEED_ADMIN_PASSWORD;
    if (!email || !password) return;

    const [user, created] = await User.findOrCreate({
        defaults: {
            email,
            name: process.env.SEED_ADMIN_NAME || 'Platform Administrator',
            passwordHash: hashPassword(password),
            role: 'ADMIN',
        },
        where: { email },
    });
    if (!created && user.role !== 'ADMIN') {
        await user.update({ role: 'ADMIN' });
    }
}

module.exports = {
    createToken,
    createScopedToken,
    hashPassword,
    seedAdminAccount,
    serializeUser,
    verifyToken,
    verifyScopedToken,
    verifyPassword,
};
