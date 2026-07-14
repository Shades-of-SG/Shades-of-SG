const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GenerationJob = sequelize.define('GenerationJob', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    songId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'song_id',
    },
    status: {
        type: DataTypes.ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED'),
        allowNull: false,
        defaultValue: 'NOT_STARTED',
    },
    errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'error_message',
    },
}, {
    tableName: 'generation_jobs',
    underscored: true,
});

module.exports = GenerationJob;
