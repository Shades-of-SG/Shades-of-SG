const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AnalyticsEvent = sequelize.define('AnalyticsEvent', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    eventType: {
        type: DataTypes.ENUM(
            'SONG_PAGE_VIEWED', 'SONG_PLAYBACK_STARTED', 'SONG_PLAYBACK_COMPLETED',
            'RHYTHM_GAME_STARTED', 'RHYTHM_GAME_COMPLETED',
            'TRIVIA_STARTED', 'TRIVIA_COMPLETED', 'REFLECTION_SUBMITTED', 'FOLDER_VIEWED'
        ),
        allowNull: false,
        field: 'event_type',
    },
    songId: { type: DataTypes.UUID, allowNull: true, field: 'song_id' },
    folderId: { type: DataTypes.UUID, allowNull: true, field: 'folder_id' },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
}, { tableName: 'analytics_events', underscored: true });

module.exports = AnalyticsEvent;
