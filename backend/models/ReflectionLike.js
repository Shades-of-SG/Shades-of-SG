const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReflectionLike = sequelize.define('ReflectionLike', {
    reflectionId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'reflection_id',
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'user_id',
    },
    createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        field: 'created_at',
    },
}, {
    tableName: 'reflection_likes',
    timestamps: false,
    underscored: true,
});

module.exports = ReflectionLike;
