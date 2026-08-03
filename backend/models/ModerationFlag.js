const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModerationFlag = sequelize.define('ModerationFlag', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    source: { type: DataTypes.ENUM('USER_REPORT', 'AUTOMATED_RULE', 'ADMIN_REVIEW', 'BEHAVIOURAL_PATTERN'), allowNull: false },
    targetType: { type: DataTypes.STRING(64), allowNull: false, field: 'target_type' },
    targetId: { type: DataTypes.UUID, allowNull: false, field: 'target_id' },
    targetUserId: { type: DataTypes.UUID, allowNull: true, field: 'target_user_id' },
    reason: { type: DataTypes.TEXT, allowNull: false },
    triggeringRule: { type: DataTypes.STRING(96), allowNull: true, field: 'triggering_rule' },
    reviewState: { type: DataTypes.ENUM('OPEN', 'DISMISSED', 'UPHELD'), allowNull: false, defaultValue: 'OPEN', field: 'review_state' },
    createdBy: { type: DataTypes.UUID, allowNull: true, field: 'created_by' },
    reviewedBy: { type: DataTypes.UUID, allowNull: true, field: 'reviewed_by' },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
}, { tableName: 'moderation_flags', underscored: true });

module.exports = ModerationFlag;
