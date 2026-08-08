const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GenerationJob = sequelize.define('GenerationJob', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    songId: { type: DataTypes.UUID, allowNull: false, field: 'song_id' },
    status: {
        type: DataTypes.ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'QUEUED',
    },
    errorMessage: { type: DataTypes.TEXT, allowNull: true, field: 'error_message' },
    startedAt: { type: DataTypes.DATE, allowNull: true, field: 'started_at' },
    completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
}, { tableName: 'generation_jobs', underscored: true });

module.exports = GenerationJob;
