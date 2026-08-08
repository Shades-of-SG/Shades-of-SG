const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InstrumentChallengeProgress = sequelize.define('InstrumentChallengeProgress', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    challengeId: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'challenge_id',
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'completed_at',
    },
}, {
    tableName: 'instrument_challenge_progress',
    underscored: true,
    indexes: [
        { unique: true, fields: ['user_id', 'challenge_id'] },
    ],
});

module.exports = InstrumentChallengeProgress;
