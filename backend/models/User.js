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
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED', 'DELETED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        field: 'account_status',
    },
    accountSuspensionReason: { type: DataTypes.TEXT, allowNull: true, field: 'account_suspension_reason' },
    deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
    creatorAccessStatus: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        field: 'creator_access_status',
    },
    creatorSuspensionReason: { type: DataTypes.TEXT, allowNull: true, field: 'creator_suspension_reason' },
    emailVerifiedAt: { type: DataTypes.DATE, allowNull: true, field: 'email_verified_at' },
    emailVerificationRequired: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'email_verification_required' },
    authVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'auth_version' },
    lastActiveDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'last_active_date' },
    currentLoginStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'current_login_streak' },
    longestLoginStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'longest_login_streak' },
}, {
    tableName: 'users',
    underscored: true,
});

module.exports = User;
