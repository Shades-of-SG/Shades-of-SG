const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongExploration = sequelize.define('SongExploration', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    songId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'song_id',
    },
    exploredAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'explored_at',
    },
}, {
    tableName: 'song_explorations',
    underscored: true,
    indexes: [
        { unique: true, fields: ['user_id', 'song_id'] },
    ],
});

module.exports = SongExploration;
