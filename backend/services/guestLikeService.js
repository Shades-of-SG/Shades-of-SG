const { Op } = require('sequelize');
const {
    GuestLikeSession, GuestReflectionLike, ReflectionLike, sequelize,
} = require('../models');

const GUEST_LIKE_COOKIE = 'shades_guest_like';
const GUEST_LIKE_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cookieOptions() {
    const secure = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        maxAge: GUEST_LIKE_MAX_AGE_MS,
        path: '/',
        sameSite: secure ? 'none' : 'lax',
        secure,
    };
}

function readCookie(req, name) {
    const header = req.get('cookie') || '';
    for (const part of header.split(';')) {
        const separator = part.indexOf('=');
        if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
        try { return decodeURIComponent(part.slice(separator + 1).trim()); } catch { return ''; }
    }
    return '';
}

function clearGuestLikeCookie(res) {
    const options = cookieOptions();
    delete options.maxAge;
    res.clearCookie(GUEST_LIKE_COOKIE, options);
}

async function getGuestLikeSession(req, res, { create = false, transaction } = {}) {
    await GuestLikeSession.destroy({ transaction, where: { expiresAt: { [Op.lte]: new Date() } } });
    const sessionId = readCookie(req, GUEST_LIKE_COOKIE);
    let session = null;
    if (UUID_PATTERN.test(sessionId)) {
        session = await GuestLikeSession.findOne({ transaction, where: { expiresAt: { [Op.gt]: new Date() }, id: sessionId } });
        if (!session) {
            await GuestLikeSession.destroy({ transaction, where: { id: sessionId } });
            clearGuestLikeCookie(res);
        }
    } else if (sessionId) {
        clearGuestLikeCookie(res);
    }
    if (session || !create) return session;

    session = await GuestLikeSession.create({ expiresAt: new Date(Date.now() + GUEST_LIKE_MAX_AGE_MS) }, { transaction });
    res.cookie(GUEST_LIKE_COOKIE, session.id, cookieOptions());
    return session;
}

async function mergeGuestLikesIntoUser(req, res, userId) {
    const sessionId = readCookie(req, GUEST_LIKE_COOKIE);
    if (!UUID_PATTERN.test(sessionId)) {
        if (sessionId) clearGuestLikeCookie(res);
        return { merged: 0 };
    }

    const merged = await sequelize.transaction(async (transaction) => {
        const session = await GuestLikeSession.findOne({ transaction, where: { expiresAt: { [Op.gt]: new Date() }, id: sessionId } });
        if (!session) {
            await GuestLikeSession.destroy({ transaction, where: { id: sessionId } });
            return 0;
        }
        const likes = await GuestReflectionLike.findAll({ attributes: ['reflectionId'], transaction, where: { guestSessionId: session.id } });
        let createdCount = 0;
        for (const like of likes) {
            const [, created] = await ReflectionLike.findOrCreate({
                defaults: { reflectionId: like.reflectionId, userId },
                transaction,
                where: { reflectionId: like.reflectionId, userId },
            });
            if (created) createdCount += 1;
        }
        await session.destroy({ transaction });
        return createdCount;
    });
    clearGuestLikeCookie(res);
    return { merged };
}

async function countReflectionLikes(reflectionId) {
    const [accountCount, guestCount] = await Promise.all([
        ReflectionLike.count({ where: { reflectionId } }),
        GuestReflectionLike.count({
            include: [{ as: 'session', attributes: [], model: GuestLikeSession, required: true, where: { expiresAt: { [Op.gt]: new Date() } } }],
            where: { reflectionId },
        }),
    ]);
    return accountCount + guestCount;
}

module.exports = {
    GUEST_LIKE_COOKIE, GUEST_LIKE_MAX_AGE_MS, clearGuestLikeCookie,
    countReflectionLikes, getGuestLikeSession, mergeGuestLikesIntoUser,
};
