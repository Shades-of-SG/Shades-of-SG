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

function optionalAuth(req, res, next) {
    req.authUser = readUser(req);
    return next();
}

function requireAuth(req, res, next) {
    req.authUser = readUser(req);

    if (!req.authUser?.id) {
        return res.status(401).json({ message: 'Please log in to continue.' });
    }

    return next();
}

async function requireCreator(req, res, next) {
    req.authUser = readUser(req);

    if (!req.authUser?.id) {
        return res.status(401).json({ message: 'Please log in to continue.' });
    }

    try {
        const user = await User.findByPk(req.authUser.id, {
            attributes: ['id', 'role'],
        });

        if (!user) {
            return res.status(401).json({ message: 'Your account could not be found.' });
        }

        if (user.role !== 'CREATOR') {
            return res.status(403).json({ message: 'Creator access is required.' });
        }

        req.authUserRecord = user;
        return next();
    } catch (error) {
        return next(error);
    }
}

module.exports = { optionalAuth, requireAuth, requireCreator };
