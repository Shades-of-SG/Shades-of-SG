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
    difficulty: {
        type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
        allowNull: false,
        defaultValue: 'EASY',
    },
}, {
    tableName: 'game_scores',
    underscored: true,
});

module.exports = GameScore;
