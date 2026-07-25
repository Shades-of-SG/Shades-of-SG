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
    bio: { //lia added this after just adding a row in supabase
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'This is my bio',
    },
    interestTags: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [], //idk man..
        field: 'interest_tags', //name from supabase
    },
    enable2fa: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'enable_2fa',
    },
    isBanned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        field: 'is_banned',
    }


}, {
    tableName: 'users',
    underscored: true,
});

module.exports = User;
