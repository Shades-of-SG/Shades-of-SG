const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Instrument = sequelize.define('Instrument', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    origin: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    imageUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'image_url',
    },
    audioUrl: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'audio_url',
    },
}, {
    tableName: 'instruments',
    underscored: true,
});

module.exports = Instrument;
