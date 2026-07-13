const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Song = sequelize.define('Song', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    creatorId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'creator_id',
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    artist: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    theme: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    language: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    moodTags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: 'mood_tags',
    },
    rawLyrics: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'raw_lyrics',
    },
    transcriptionSegments: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'transcription_segments',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    audioUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'audio_url',
    },
    videoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'video_url',
    },
    status: {
        type: DataTypes.ENUM('DRAFT', 'PUBLISHED'),
        allowNull: false,
        defaultValue: 'DRAFT',
    },
    publishedDate: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'published_date',
    },
}, {
    tableName: 'songs',
    underscored: true,
});

module.exports = Song;
