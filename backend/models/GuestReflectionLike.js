const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GuestReflectionLike = sequelize.define('GuestReflectionLike', {
    reflectionId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'reflection_id',
    },
    guestSessionId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'guest_session_id',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'guest_reflection_likes',
    timestamps: false,
    underscored: true,
});

module.exports = GuestReflectionLike;
