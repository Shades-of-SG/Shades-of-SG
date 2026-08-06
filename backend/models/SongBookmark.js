const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongBookmark = sequelize.define('SongBookmark', {
    userId: { type: DataTypes.UUID, primaryKey: true, field: 'user_id' },
    songId: { type: DataTypes.UUID, primaryKey: true, field: 'song_id' },
}, { tableName: 'song_bookmarks', underscored: true, updatedAt: false });

module.exports = SongBookmark;
