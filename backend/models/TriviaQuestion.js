const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TriviaQuestion = sequelize.define('TriviaQuestion', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    songId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'song_id',
    },
    prompt: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    type: {
        type: DataTypes.ENUM('MULTIPLE_CHOICE', 'TRUE_FALSE'),
        allowNull: false,
        defaultValue: 'MULTIPLE_CHOICE',
    },
    options: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    correctAnswer: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'correct_answer',
    },
}, {
    tableName: 'trivia_questions',
    underscored: true,
});

module.exports = TriviaQuestion;
