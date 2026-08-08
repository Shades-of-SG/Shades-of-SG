const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongFolder = sequelize.define('SongFolder', {
    songId: { type: DataTypes.UUID, primaryKey: true, field: 'song_id' },
    folderId: { type: DataTypes.UUID, primaryKey: true, field: 'folder_id' },
    addedBy: { type: DataTypes.UUID, allowNull: false, field: 'added_by' },
    songOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'song_order' },
}, { tableName: 'song_folders', underscored: true });

module.exports = SongFolder;
