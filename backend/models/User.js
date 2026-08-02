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

    isBanned: {     //Can prob remove this column since now got account status UNLESS you want to use for permanent ban but that is a different table
        type: DataTypes.BOOLEAN, 
        defaultValue: false,
        allowNull: false,
        field: 'is_banned',
    },

    accountStatus: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        field: 'account_status',
    },
    accountSuspensionReason: { type: DataTypes.TEXT, allowNull: true, field: 'account_suspension_reason' },
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
}, {
    tableName: 'users',
    underscored: true,
});

module.exports = User;
