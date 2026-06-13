const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'password_hash',
    },
    role: {
        type: DataTypes.ENUM('CREATOR', 'REGISTERED'),
        allowNull: false,
        defaultValue: 'REGISTERED',
    },
}, {
    tableName: 'users',
    underscored: true,
});

module.exports = User;
