const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TriviaAttempt = sequelize.define('TriviaAttempt', {
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
    questionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'question_id',
    },
    selectedAnswer: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'selected_answer',
    },
    isCorrect: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        field: 'is_correct',
    },
}, {
    tableName: 'trivia_attempts',
    underscored: true,
});

module.exports = TriviaAttempt;
