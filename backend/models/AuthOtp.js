const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthOtp = sequelize.define('AuthOtp', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
    email: { type: DataTypes.STRING(320), allowNull: false },
    purpose: { type: DataTypes.ENUM('REGISTRATION', 'PASSWORD_RESET', 'EMAIL_CHANGE'), allowNull: false },
    otpHash: { type: DataTypes.STRING, allowNull: false, field: 'otp_hash' },
    requestIpHash: { type: DataTypes.STRING(128), allowNull: true, field: 'request_ip_hash' },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
    attemptCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'attempt_count' },
    usedAt: { type: DataTypes.DATE, allowNull: true, field: 'used_at' },
}, { tableName: 'auth_otps', underscored: true });

module.exports = AuthOtp;
