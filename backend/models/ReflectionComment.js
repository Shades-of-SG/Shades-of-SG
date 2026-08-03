const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReflectionComment = sequelize.define('ReflectionComment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    reflectionId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'reflection_id',
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { len: [1, 500] },
    },
    status: {
        type: DataTypes.ENUM('VISIBLE', 'REMOVED'),
        allowNull: false,
        defaultValue: 'VISIBLE',
    },
}, {
    tableName: 'reflection_comments',
    underscored: true,
});

module.exports = ReflectionComment;
