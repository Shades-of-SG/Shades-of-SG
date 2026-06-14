const crypto = require('crypto');
const User = require('../models/User');

const HASH_ITERATIONS = 120000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';

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
    const secret = process.env.AUTH_TOKEN_SECRET || 'local-dev-auth-secret';
    const payload = Buffer.from(JSON.stringify({
        email: user.email,
        id: user.id,
        role: user.role,
    })).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');

    return `${payload}.${signature}`;
}

function serializeUser(user) {
    return {
        email: user.email,
        id: user.id,
        name: user.name,
        role: user.role,
    };
}

async function seedCreatorAccount() {
    const email = process.env.SEED_CREATOR_EMAIL;
    const password = process.env.SEED_CREATOR_PASSWORD;

    if (!email || !password) {
        return;
    }

    const [user, created] = await User.findOrCreate({
        defaults: {
            email,
            name: process.env.SEED_CREATOR_NAME || 'Violet',
            passwordHash: hashPassword(password),
            role: 'CREATOR',
        },
        where: { email },
    });

    if (!created && user.role !== 'CREATOR') {
        user.role = 'CREATOR';
        await user.save();
    }
}

module.exports = {
    createToken,
    hashPassword,
    seedCreatorAccount,
    serializeUser,
    verifyPassword,
};
