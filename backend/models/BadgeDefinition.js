const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BadgeDefinition = sequelize.define('BadgeDefinition', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    imageKey: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'image_key',
    },
    sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
    },
}, {
    tableName: 'badge_definitions',
    underscored: true,
});

module.exports = BadgeDefinition;
