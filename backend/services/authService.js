const crypto = require('crypto');
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
    const [algorithm, iterations, salt, hash] = storedHash.split('$');

    if (algorithm !== 'pbkdf2' || !iterations || !salt || !hash) {
        return false;
    }

    const nextHash = crypto
        .pbkdf2Sync(password, salt, Number(iterations), HASH_KEY_LENGTH, HASH_DIGEST)
        .toString('hex');

    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(nextHash, 'hex'));
}

function createToken(user) {
    const secret = getTokenSecret();
    const payload = Buffer.from(JSON.stringify({
        email: user.email,
        id: user.id,
        role: user.role,
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

    return `${payload}.${signature}`;
}

function verifyToken(token) {
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
        return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    } catch {
        return null;
    }
}

function serializeUser(user) {
    return {
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
    };
}

module.exports = {
    createToken,
    hashPassword,
    serializeUser,
    verifyToken,
    verifyPassword,
};
