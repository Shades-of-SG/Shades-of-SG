const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GeneratedFrame = sequelize.define('GeneratedFrame', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    sceneSegmentId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'scene_segment_id',
    },
    promptHash: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'prompt_hash',
    },
    cloudinaryId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'cloudinary_id',
    },
    imageUrl: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'image_url',
    },
    frameOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'frame_order',
    },
}, {
    tableName: 'generated_frames',
    underscored: true,
});

module.exports = GeneratedFrame;
