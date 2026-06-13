const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Session = sequelize.define('Session', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'user_id',
    },
    guestId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'guest_id',
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'expires_at',
    },
}, {
    tableName: 'sessions',
    underscored: true,
});

module.exports = Session;
