const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongReport = sequelize.define('SongReport', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    songId: { type: DataTypes.UUID, allowNull: false, field: 'song_id' },
    reason: { type: DataTypes.STRING(32), allowNull: false },
    details: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'PENDING' },
}, { tableName: 'song_reports', underscored: true });

module.exports = SongReport;
