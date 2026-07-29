const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actorId: { type: DataTypes.UUID, allowNull: true, field: 'actor_id' },
    action: { type: DataTypes.STRING(96), allowNull: false },
    entityType: { type: DataTypes.STRING(64), allowNull: false, field: 'entity_type' },
    entityId: { type: DataTypes.UUID, allowNull: true, field: 'entity_id' },
    songId: { type: DataTypes.UUID, allowNull: true, field: 'song_id' },
    creatorId: { type: DataTypes.UUID, allowNull: true, field: 'creator_id' },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    ipAddress: { type: DataTypes.STRING(64), allowNull: true, field: 'ip_address' },
}, { tableName: 'audit_logs', underscored: true, updatedAt: false });

module.exports = AuditLog;
