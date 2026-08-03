const buckets = new Map();

function createRateLimit({ key, max, windowMs }) {
    return function rateLimit(req, res, next) {
        const now = Date.now();
        const bucketKeys = [...new Set([key(req)].flat().filter(Boolean))];
        let retryAfter = 0;
        for (const bucketKey of bucketKeys) {
            const current = buckets.get(bucketKey);
            if (current?.resetAt > now && current.count >= max) {
                retryAfter = Math.max(retryAfter, Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
            }
        }
        if (retryAfter) {
            res.set('Retry-After', String(retryAfter));
            return res.status(429).json({ message: 'Too many requests. Please wait before trying again.' });
        }
        for (const bucketKey of bucketKeys) {
            const current = buckets.get(bucketKey);
            if (!current || current.resetAt <= now) buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
            else current.count += 1;
        }
        return next();
    };
}

function authRateKey(scope) {
    return (req) => {
        const email = String(req.body?.email || '').trim().toLowerCase();
        return [`${scope}:ip:${req.ip}`, `${scope}:email:${email || '<missing>'}`];
    };
}

module.exports = { authRateKey, createRateLimit, resetRateLimitsForTests: () => buckets.clear() };
