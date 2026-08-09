const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GuestLikeSession = sequelize.define('GuestLikeSession', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: 'expires_at' },
}, {
    indexes: [{ fields: ['expires_at'], name: 'guest_like_sessions_expires_idx' }],
    tableName: 'guest_like_sessions',
    underscored: true,
});

module.exports = GuestLikeSession;
