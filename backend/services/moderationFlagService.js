const { ModerationFlag } = require('../models');

const FLAG_SOURCES = new Set(['USER_REPORT', 'AUTOMATED_RULE', 'ADMIN_REVIEW', 'BEHAVIOURAL_PATTERN']);

async function createModerationFlag({
    source, targetType, targetId, reason, targetUserId = null, triggeringRule = null,
    createdBy = null, metadata = {}, transaction,
}) {
    if (!FLAG_SOURCES.has(source)) throw new Error('Unsupported moderation flag source.');
    const values = {
        createdBy, metadata, reason, source, targetId, targetType, targetUserId, triggeringRule,
    };
    if (source !== 'AUTOMATED_RULE') return ModerationFlag.create(values, { transaction });
    const where = { reviewState: 'OPEN', source, targetId, targetType, triggeringRule };
    const existing = await ModerationFlag.findOne({ transaction, where });
    if (existing) return existing;
    return ModerationFlag.create(values, { transaction });
}

module.exports = { createModerationFlag, FLAG_SOURCES };
