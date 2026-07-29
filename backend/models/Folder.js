const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Folder = sequelize.define('Folder', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    origin: { type: DataTypes.ENUM('PLATFORM', 'CREATOR_PROPOSAL'), allowNull: false, defaultValue: 'PLATFORM' },
    status: { type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'ARCHIVED'), allowNull: false, defaultValue: 'APPROVED' },
    createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
    proposedBy: { type: DataTypes.UUID, allowNull: true, field: 'proposed_by' },
    reviewedBy: { type: DataTypes.UUID, allowNull: true, field: 'reviewed_by' },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
    reviewNote: { type: DataTypes.TEXT, allowNull: true, field: 'review_note' },
}, { tableName: 'folders', underscored: true });

module.exports = Folder;

