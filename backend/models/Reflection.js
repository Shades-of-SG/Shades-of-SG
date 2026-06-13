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
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'FLAGGED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
}, {
    tableName: 'reflections',
    underscored: true,
});

module.exports = Reflection;
