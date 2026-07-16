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
    languages: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    otherLanguages: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
        field: 'other_languages',
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
    videoUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'video_url',
    },
    coverImageUrl: { type: DataTypes.TEXT, allowNull: true, field: 'cover_image_url' },
    coverImagePublicId: { type: DataTypes.STRING, allowNull: true, field: 'cover_image_public_id' },
    audioUrl: { type: DataTypes.TEXT, allowNull: true, field: 'audio_url' },
    audioFileName: { type: DataTypes.STRING, allowNull: true, field: 'audio_file_name' },
    audioPublicId: { type: DataTypes.STRING, allowNull: true, field: 'audio_public_id' },
    sourceYoutubeUrl: { type: DataTypes.TEXT, allowNull: true, field: 'source_youtube_url' },
    videoPublicId: { type: DataTypes.STRING, allowNull: true, field: 'video_public_id' },
    durationSecs: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_secs', validate: { min: 0 } },
    status: {
        type: DataTypes.ENUM('DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'),
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
