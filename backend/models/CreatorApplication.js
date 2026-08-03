const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CreatorApplication = sequelize.define('CreatorApplication', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false, field: 'user_id' },
    resumeUrl: { type: DataTypes.TEXT, allowNull: true, field: 'resume_url' },
    portfolioUrl: { type: DataTypes.TEXT, allowNull: true, field: 'portfolio_url' },
    statement: { type: DataTypes.TEXT, allowNull: true },
    introduction: { type: DataTypes.TEXT, allowNull: true },
    experience: { type: DataTypes.TEXT, allowNull: true },
    motivation: { type: DataTypes.TEXT, allowNull: true },
    contentIdeas: { type: DataTypes.TEXT, allowNull: true, field: 'content_ideas' },
    guidelinesAccepted: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'guidelines_accepted' },
    applicantFeedback: { type: DataTypes.TEXT, allowNull: true, field: 'applicant_feedback' },
    resumeFileName: { type: DataTypes.STRING, allowNull: true, field: 'resume_file_name' },
    resumeMimeType: { type: DataTypes.STRING, allowNull: true, field: 'resume_mime_type' },
    resumeData: { type: DataTypes.BLOB, allowNull: true, field: 'resume_data' },
    resumeFileSize: { type: DataTypes.INTEGER, allowNull: true, field: 'resume_file_size' },
    status: {
        type: DataTypes.ENUM('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'SHORTLISTED', 'INTERVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'),
        allowNull: false,
        defaultValue: 'SUBMITTED',
    },
    reviewedBy: { type: DataTypes.UUID, allowNull: true, field: 'reviewed_by' },
    reviewedAt: { type: DataTypes.DATE, allowNull: true, field: 'reviewed_at' },
    adminNotes: { type: DataTypes.TEXT, allowNull: true, field: 'admin_notes' },
    submittedAt: { type: DataTypes.DATE, allowNull: true, field: 'submitted_at' },
    withdrawnAt: { type: DataTypes.DATE, allowNull: true, field: 'withdrawn_at' },
}, { tableName: 'creator_applications', underscored: true });

module.exports = CreatorApplication;
