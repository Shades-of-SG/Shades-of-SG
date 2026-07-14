const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reflection = sequelize.define('Reflection', {
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
    displayName: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'display_name',
    },
    displayMode: {
        type: DataTypes.ENUM('PROFILE', 'ANONYMOUS'),
        allowNull: false,
        defaultValue: 'ANONYMOUS',
        field: 'display_mode',
    },
    guestSubmission: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'guest_submission',
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    tags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    moderatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'moderated_by',
    },
    moderatedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'moderated_at',
    },
    moderatorNote: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'moderator_note',
    },
}, {
    tableName: 'reflections',
    underscored: true,
});

module.exports = Reflection;
