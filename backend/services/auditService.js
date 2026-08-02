const { AuditLog } = require('../models');

function requestIp(req) {
    return req?.ip || req?.socket?.remoteAddress || null;
}

async function writeAudit({
    action,
    actorId,
    creatorId = null,
    entityId = null,
    entityType,
    metadata = {},
    req,
    songId = null,
    transaction,
}) {
    return AuditLog.create({
        action,
        actorId,
        creatorId,
        entityId,
        entityType,
        ipAddress: requestIp(req),
        metadata,
        songId,
    }, { transaction });
}

module.exports = { writeAudit };
