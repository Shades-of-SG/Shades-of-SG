const crypto = require('crypto');
const User = require('../models/User');
const jwt = require("jsonwebtoken");

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
    const secret = process.env.AUTH_TOKEN_SECRET || "local-dev-auth-secret";
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, bio: user.bio, interestTags: user.interestTags, enable2fa: user.enable2fa },
        secret,
        { expiresIn: "7d" }
    );
}

function serializeUser(user) {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        interestTags: user.interestTags,
        enable2fa: user.enable2fa,
        isBanned: user.isBanned
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
