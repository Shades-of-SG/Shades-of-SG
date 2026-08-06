const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserWarning = sequelize.define('UserWarning', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    issuedBy: { type: DataTypes.UUID, allowNull: true, field: 'issued_by' },
    reason: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('ACTIVE', 'RESOLVED'), allowNull: false, defaultValue: 'ACTIVE' },
    resolvedBy: { type: DataTypes.UUID, allowNull: true, field: 'resolved_by' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
    resolutionNote: { type: DataTypes.TEXT, allowNull: true, field: 'resolution_note' },
}, { tableName: 'user_warnings', underscored: true });

module.exports = UserWarning;

