const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SceneSegment = sequelize.define('SceneSegment', {
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
    startTime: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'start_time',
    },
    endTime: {
        type: DataTypes.FLOAT,
        allowNull: false,
        field: 'end_time',
    },
    lyrics: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    emotion: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    visualPrompt: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'visual_prompt',
    },
}, {
    tableName: 'scene_segments',
    underscored: true,
});

module.exports = SceneSegment;
