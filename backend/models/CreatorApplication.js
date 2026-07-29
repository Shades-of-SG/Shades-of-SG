const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreatorApplication = sequelize.define('CreatorApplication', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    resumeUrl: { type: DataTypes.TEXT, allowNull: true, field: 'resume_url' },
    portfolioUrl: { type: DataTypes.TEXT, allowNull: true, field: 'portfolio_url' },
    statement: { type: DataTypes.TEXT, allowNull: false },
    status: {
        type: DataTypes.ENUM('SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'SUBMITTED',
    },
    reviewedBy: { type: DataTypes.UUID, allowNull: true, field: 'reviewed_by' },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
    adminNotes: { type: DataTypes.TEXT, allowNull: true, field: 'admin_notes' },
}, { tableName: 'creator_applications', underscored: true });

module.exports = CreatorApplication;

