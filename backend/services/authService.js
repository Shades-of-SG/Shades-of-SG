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

function hashPasswordAsync(password, salt = crypto.randomBytes(16).toString('hex')) {
    return new Promise((resolve, reject) => {
        crypto.pbkdf2(password, salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST, (error, derivedKey) => {
            if (error) return reject(error);
            return resolve(`pbkdf2$${HASH_ITERATIONS}$${salt}$${derivedKey.toString('hex')}`);
        });
    });
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

function accountSuspensionMessage(user) {
    const reason = String(user?.accountSuspensionReason || '').trim();
    return `Your Shades of SG account has been suspended.${reason ? ` Reason: ${reason}` : ''} Contact Shades of SG support if you would like to appeal or believe this is a mistake.`;
}

function creatorSuspensionMessage(user) {
    const reason = String(user?.creatorSuspensionReason || '').trim();
    return `Your creator access has been suspended. You can continue using Shades of SG as a regular user, but creator tools are currently unavailable.${reason ? ` Reason: ${reason}` : ''}`;
}

function serializeUser(user) {
    const profile = user.profile?.get ? user.profile.get({ plain: true }) : user.profile;
    return {
        createdAt: user.createdAt,
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
        accountStatus: user.accountStatus,
        userStatus: user.accountStatus,
        accountSuspensionReason: user.accountSuspensionReason,
        creatorAccessStatus: user.creatorAccessStatus || 'ACTIVE',
        creatorStatus: user.creatorAccessStatus || 'ACTIVE',
        creatorSuspensionReason: user.creatorSuspensionReason,
        emailVerified: !user.emailVerificationRequired,
        sharedProfile: profile ? {
            avatarUrl: profile.avatarUrl || '', bio: profile.bio || '', displayName: profile.displayName,
            interestTags: Array.isArray(profile.interestTags) ? profile.interestTags : [],
            fontSize: profile.fontSize, location: profile.location || '', preferredLanguage: profile.preferredLanguage || '',
            profileVisibility: profile.profileVisibility, reducedMotion: profile.reducedMotion,
            showBadges: profile.showBadges, showReflections: profile.showReflections,
            showRhythmRanking: profile.showRhythmRanking, theme: profile.theme,
        } : undefined,
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
    accountSuspensionMessage,
    createToken,
    creatorSuspensionMessage,
    createScopedToken,
    hashPassword,
    hashPasswordAsync,
    seedAdminAccount,
    serializeUser,
    verifyToken,
    verifyScopedToken,
    verifyPassword,
};
