const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReflectionCommentLike = sequelize.define('ReflectionCommentLike', {
    commentId: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        field: 'comment_id',
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
    tableName: 'reflection_comment_likes',
    timestamps: false,
    underscored: true,
});

module.exports = ReflectionCommentLike;
