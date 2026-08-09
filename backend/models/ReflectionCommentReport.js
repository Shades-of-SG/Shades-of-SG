const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReflectionCommentReport = sequelize.define('ReflectionCommentReport', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    commentId: { type: DataTypes.UUID, allowNull: false, field: 'comment_id' },
    reporterId: { type: DataTypes.UUID, allowNull: false, field: 'reporter_id' },
    reason: { type: DataTypes.TEXT, allowNull: false, validate: { len: [5, 500] } },
    status: {
        type: DataTypes.ENUM('PENDING', 'DISMISSED', 'ACTIONED'),
        allowNull: false,
        defaultValue: 'PENDING',
    },
    resolvedBy: { type: DataTypes.UUID, allowNull: true, field: 'resolved_by' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
    resolutionReason: { type: DataTypes.TEXT, allowNull: true, field: 'resolution_reason', validate: { len: [5, 2000] } },
}, {
    indexes: [{ fields: ['comment_id', 'reporter_id'], name: 'reflection_comment_reports_comment_reporter_unique', unique: true }],
    tableName: 'reflection_comment_reports',
    underscored: true,
});

module.exports = ReflectionCommentReport;
