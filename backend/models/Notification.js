const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    warningId: { type: DataTypes.UUID, allowNull: true, field: 'warning_id' },
    type: { type: DataTypes.STRING(64), allowNull: false },
    title: { type: DataTypes.STRING(160), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    link: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '/settings/safety' },
    readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
}, { tableName: 'notifications', underscored: true });

module.exports = Notification;
