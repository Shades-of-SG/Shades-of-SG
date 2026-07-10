const { verifyToken } = require('../services/authService');

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

module.exports = { optionalAuth, requireAuth };
