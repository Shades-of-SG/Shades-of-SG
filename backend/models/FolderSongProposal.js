const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FolderSongProposal = sequelize.define('FolderSongProposal', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    songId: { type: DataTypes.UUID, allowNull: false, field: 'song_id' },
    folderId: { type: DataTypes.UUID, allowNull: false, field: 'folder_id' },
    proposedBy: { type: DataTypes.UUID, allowNull: false, field: 'proposed_by' },
    status: { type: DataTypes.ENUM('PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'), allowNull: false, defaultValue: 'PENDING' },
    creatorNote: { type: DataTypes.TEXT, allowNull: true, field: 'creator_note' },
    reviewNote: { type: DataTypes.TEXT, allowNull: true, field: 'review_note' },
    reviewedBy: { type: DataTypes.UUID, allowNull: true, field: 'reviewed_by' },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
}, { tableName: 'folder_song_proposals', underscored: true });

module.exports = FolderSongProposal;

