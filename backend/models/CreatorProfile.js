const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreatorProfile = sequelize.define('CreatorProfile', {
    userId: { type: DataTypes.UUID, allowNull: false, primaryKey: true, field: 'user_id' },
    tagline: { type: DataTypes.STRING(160), allowNull: true },
    bio: { type: DataTypes.TEXT, allowNull: true },
    languages: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    contentFocus: { type: DataTypes.JSON, allowNull: false, defaultValue: [], field: 'content_focus' },
    location: { type: DataTypes.STRING(100), allowNull: true },
    creatorTitle: { type: DataTypes.STRING(100), allowNull: true, field: 'creator_title' },
    featuredQuote: { type: DataTypes.STRING(300), allowNull: true, field: 'featured_quote' },
    socialLinks: { type: DataTypes.JSON, allowNull: false, defaultValue: {}, field: 'social_links' },
    visibility: { type: DataTypes.ENUM('PUBLIC', 'PRIVATE'), allowNull: false, defaultValue: 'PUBLIC' },
    showCommunityReflections: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'show_community_reflections' },
}, {
    tableName: 'creator_public_profiles',
    underscored: true,
});

module.exports = CreatorProfile;
