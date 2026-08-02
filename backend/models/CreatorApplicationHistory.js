const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreatorApplicationHistory = sequelize.define('CreatorApplicationHistory', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    applicationId: { type: DataTypes.UUID, allowNull: false, field: 'application_id' },
    actorId: { type: DataTypes.UUID, allowNull: true, field: 'actor_id' },
    fromStatus: { type: DataTypes.STRING(32), allowNull: true, field: 'from_status' },
    toStatus: { type: DataTypes.STRING(32), allowNull: false, field: 'to_status' },
    note: { type: DataTypes.TEXT, allowNull: true },
    visibleToApplicant: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'visible_to_applicant' },
}, { tableName: 'creator_application_history', underscored: true });

module.exports = CreatorApplicationHistory;

