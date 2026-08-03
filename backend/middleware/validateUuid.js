const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value) {
    return typeof value === 'string' && UUID_PATTERN.test(value);
}

function validateUuidParam(paramName, message = `${paramName} must be a valid UUID.`) {
    return (req, res, next, value = req.params[paramName]) => {
        if (!isUuid(value)) return res.status(400).json({ message });
        return next();
    };
}

module.exports = { isUuid, validateUuidParam };
