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
    // Stable lookup key for the fixed set of Instrument Discovery Lab instruments
    // (piano, angklung, kompang, erhu, tabla), distinct from the auto-generated uuid `id`.
    slug: {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
    },
    // Maps a note label (e.g. "C4") to either a Cloudinary URL (direct recording)
    // or { url, playbackRate } (a recording borrowed from another note and pitch-shifted).
    // Notes absent from this map simply have no real sample — the frontend falls
    // back to its synthesized oscillator tone for that note.
    samples: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
    },
    sampleFormat: {
        type: DataTypes.STRING(16),
        allowNull: false,
        defaultValue: 'mp3',
        field: 'sample_format',
    },
    sampleLicense: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'sample_license',
    },
    sampleAttribution: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'sample_attribution',
    },
}, {
    tableName: 'instruments',
    underscored: true,
});

module.exports = Instrument;
