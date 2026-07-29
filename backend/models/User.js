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
        type: DataTypes.ENUM('ADMIN', 'CREATOR', 'REGISTERED'),
        allowNull: false,
        defaultValue: 'REGISTERED',
    },
    accountStatus: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        field: 'account_status',
    },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verified_at' },
    emailVerificationRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'email_verification_required' },
    authVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'auth_version' },
}, {
    tableName: 'users',
    underscored: true,
});

module.exports = User;
