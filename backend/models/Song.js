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
        allowNull: false,
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
    sectionRecommendations: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'section_recommendations',
    },
    sectionRecommendationsConfirmedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'section_recommendations_confirmed_at',
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    aiSummary: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'ai_summary',
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
    bookmark: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
}, {
    tableName: 'songs',
    underscored: true,
});

module.exports = Song;
