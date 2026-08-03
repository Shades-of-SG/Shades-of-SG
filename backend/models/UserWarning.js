const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserWarning = sequelize.define('UserWarning', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    issuedBy: { type: DataTypes.UUID, allowNull: false, field: 'issued_by' },
    reason: { type: DataTypes.TEXT, allowNull: false },
    category: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'OTHER' },
    userFacingReason: { type: DataTypes.TEXT, allowNull: true, field: 'user_facing_reason' },
    internalNote: { type: DataTypes.TEXT, allowNull: true, field: 'internal_note' },
    targetType: { type: DataTypes.STRING(64), allowNull: true, field: 'target_type' },
    targetId: { type: DataTypes.UUID, allowNull: true, field: 'target_id' },
    actionTaken: { type: DataTypes.STRING(64), allowNull: true, field: 'action_taken' },
    requiredNextStep: { type: DataTypes.TEXT, allowNull: true, field: 'required_next_step' },
    status: { type: DataTypes.ENUM('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'WITHDRAWN'), allowNull: false, defaultValue: 'ACTIVE' },
    acknowledgedAt: { type: DataTypes.DATE, allowNull: true, field: 'acknowledged_at' },
    resolvedBy: { type: DataTypes.UUID, allowNull: true, field: 'resolved_by' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
    withdrawnAt: { type: DataTypes.DATE, allowNull: true, field: 'withdrawn_at' },
    resolutionNote: { type: DataTypes.TEXT, allowNull: true, field: 'resolution_note' },
}, { tableName: 'user_warnings', underscored: true });

module.exports = UserWarning;
