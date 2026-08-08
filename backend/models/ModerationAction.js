const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ModerationAction = sequelize.define('ModerationAction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    actorId: { type: DataTypes.UUID, allowNull: true, field: 'actor_id' },
    targetUserId: { type: DataTypes.UUID, allowNull: true, field: 'target_user_id' },
    actionType: { type: DataTypes.STRING(64), allowNull: false, field: 'action_type' },
    targetType: { type: DataTypes.STRING(64), allowNull: false, field: 'target_type' },
    targetId: { type: DataTypes.UUID, allowNull: true, field: 'target_id' },
    songId: { type: DataTypes.UUID, allowNull: true, field: 'song_id' },
    reason: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
}, { tableName: 'moderation_actions', underscored: true });

module.exports = ModerationAction;

