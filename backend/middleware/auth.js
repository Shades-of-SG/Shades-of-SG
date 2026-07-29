const { verifyToken } = require('../services/authService');
const User = require('../models/User');

function readUser(req) {
    const authorization = req.get('authorization') || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
        return null;
    }

    return verifyToken(token);
}

async function loadCurrentUser(req) {
    req.authUser = readUser(req);
    if (!req.authUser?.id) return null;
    const user = await User.findByPk(req.authUser.id, {
        attributes: ['id', 'role', 'accountStatus'],
    });
    req.authUserRecord = user || null;
    return user;
}

async function optionalAuth(req, res, next) {
    try {
        const user = await loadCurrentUser(req);
        if (!user || user.accountStatus !== 'ACTIVE') {
            req.authUser = null;
            req.authUserRecord = null;
        }
        return next();
    } catch (error) {
        return next(error);
    }
}

function requireRoles(...roles) {
    return async function roleMiddleware(req, res, next) {
        try {
            const user = await loadCurrentUser(req);
            if (!req.authUser?.id || !user) {
                return res.status(401).json({ message: 'Please log in to continue.' });
            }
            if (user.accountStatus !== 'ACTIVE') {
                return res.status(403).json({ message: 'This account is suspended.' });
            }
            if (roles.length && !roles.includes(user.role)) {
                const label = roles.length === 1 ? roles[0].toLowerCase() : 'authorised';
                return res.status(403).json({ message: `${label[0].toUpperCase()}${label.slice(1)} access is required.` });
            }
            return next();
        } catch (error) {
            return next(error);
        }
    };
}

const requireAuth = requireRoles();
const requireCreator = requireRoles('CREATOR');
const requireAdmin = requireRoles('ADMIN');
const requireCreatorOrAdmin = requireRoles('CREATOR', 'ADMIN');

module.exports = { optionalAuth, requireAdmin, requireAuth, requireCreator, requireCreatorOrAdmin };
