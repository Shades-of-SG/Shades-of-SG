const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuthIdentity = sequelize.define('AuthIdentity', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
    },
    provider: {
        type: DataTypes.ENUM('GOOGLE', 'APPLE'),
        allowNull: false,
    },
    providerSubject: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'provider_subject',
    },
}, {
    tableName: 'auth_identities',
    underscored: true,
    indexes: [
        { fields: ['provider', 'provider_subject'], unique: true },
        { fields: ['user_id', 'provider'], unique: true },
    ],
});

module.exports = AuthIdentity;
