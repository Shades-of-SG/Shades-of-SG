const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserProfile = sequelize.define('UserProfile', {
    userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, field: 'user_id' },
    displayName: { type: DataTypes.STRING(80), allowNull: false, field: 'display_name' },
    avatarUrl: { type: DataTypes.TEXT, allowNull: true, field: 'avatar_url' },
    avatarPublicId: { type: DataTypes.STRING, allowNull: true, field: 'avatar_public_id' },
    bio: { type: DataTypes.STRING(500), allowNull: true },
    interestTags: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: 'interest_tags' },
    profileVisibility: {
        type: DataTypes.ENUM('PUBLIC', 'PRIVATE'), allowNull: false, defaultValue: 'PUBLIC', field: 'profile_visibility',
    },
    preferredLanguage: { type: DataTypes.STRING(40), allowNull: true, field: 'preferred_language' },
    location: { type: DataTypes.STRING(100), allowNull: true },
    theme: { type: DataTypes.ENUM('SYSTEM', 'LIGHT', 'DARK'), allowNull: false, defaultValue: 'SYSTEM' },
    fontSize: { type: DataTypes.ENUM('SMALL', 'MEDIUM', 'LARGE'), allowNull: false, defaultValue: 'MEDIUM', field: 'font_size' },
    reducedMotion: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'reduced_motion' },
    showBadges: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_badges' },
    showRhythmRanking: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_rhythm_ranking' },
    showReflections: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_reflections' },
}, {
    tableName: 'user_profiles',
    underscored: true,
});

module.exports = UserProfile;
