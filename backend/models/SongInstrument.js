const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SongInstrument = sequelize.define('SongInstrument', {
    songId: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: 'song_id',
    },
    instrumentId: {
        type: DataTypes.UUID,
        primaryKey: true,
        field: 'instrument_id',
    },
    role: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'song_instruments',
    underscored: true,
});

module.exports = SongInstrument;
