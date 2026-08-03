const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GameScore = sequelize.define('GameScore', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
    },
    songId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'song_id',
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
    },
    accuracy: {
        type: DataTypes.FLOAT,
        allowNull: true,
    },
    maxCombo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'max_combo',
    },
    rank: {
        type: DataTypes.ENUM('S', 'A', 'B', 'C'),
        allowNull: false,
        defaultValue: 'C',
    },
    difficulty: {
        type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
        allowNull: false,
        defaultValue: 'EASY',
    },
    claimId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'claim_id',
    },
}, {
    indexes: [{ fields: ['claim_id'], name: 'game_scores_claim_id_unique_idx', unique: true }],
    tableName: 'game_scores',
    underscored: true,
});

module.exports = GameScore;
