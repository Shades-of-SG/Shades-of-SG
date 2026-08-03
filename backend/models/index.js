const sequelize = require('../config/database');
const User = require('./User');
const Session = require('./Session');
const Song = require('./Song');
const Instrument = require('./Instrument');
const Lesson = require('./Lesson');
const GameScore = require('./GameScore');
const Reflection = require('./Reflection');
const Badge = require('./Badge');
const TriviaQuestion = require('./TriviaQuestion');
const TriviaAttempt = require('./TriviaAttempt');
const GenerationJob = require('./GenerationJob');
const SceneSegment = require('./SceneSegment');
const GeneratedFrame = require('./GeneratedFrame');
const SongInstrument = require('./SongInstrument');
const RhythmBeatmap = require('./RhythmBeatmap');
const CreatorApplication = require('./CreatorApplication');
const Folder = require('./Folder');
const SongFolder = require('./SongFolder');
const UserWarning = require('./UserWarning');
const ModerationAction = require('./ModerationAction');
const AuditLog = require('./AuditLog');
const CreatorApplicationHistory = require('./CreatorApplicationHistory');
const FolderSongProposal = require('./FolderSongProposal');
const AnalyticsEvent = require('./AnalyticsEvent');
const AuthOtp = require('./AuthOtp');
const AuthIdentity = require('./AuthIdentity');
const CreatorProfile = require('./CreatorProfile');
const UserProfile = require('./UserProfile');
const ReflectionComment = require('./ReflectionComment');
const ReflectionLike = require('./ReflectionLike');
const Notification = require('./Notification');
const ModerationFlag = require('./ModerationFlag');

User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuthOtp, { foreignKey: 'userId', as: 'authOtps' });
AuthOtp.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(AuthIdentity, { foreignKey: 'userId', as: 'authIdentities' });
AuthIdentity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Song, { foreignKey: 'creatorId', as: 'songs' });
Song.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
User.hasOne(CreatorProfile, { foreignKey: 'userId', as: 'creatorProfile' });
CreatorProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });
UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Song.hasMany(Lesson, { foreignKey: 'songId', as: 'lessons' });
Lesson.belongsTo(Song, { foreignKey: 'songId', as: 'song' });

Song.hasMany(GameScore, { foreignKey: 'songId', as: 'gameScores' });
GameScore.belongsTo(Song, { foreignKey: 'songId', as: 'song' });
User.hasMany(GameScore, { foreignKey: 'userId', as: 'gameScores' });
GameScore.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Song.hasMany(RhythmBeatmap, { foreignKey: 'songId', as: 'rhythmBeatmaps' });
RhythmBeatmap.belongsTo(Song, { foreignKey: 'songId', as: 'song' });

Song.hasMany(Reflection, { foreignKey: 'songId', as: 'reflections' });
Reflection.belongsTo(Song, { foreignKey: 'songId', as: 'song' });
User.hasMany(Reflection, { foreignKey: 'userId', as: 'reflections' });
Reflection.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Reflection, { foreignKey: 'moderatedBy', as: 'moderatedReflections' });
Reflection.belongsTo(User, { foreignKey: 'moderatedBy', as: 'moderator' });
Reflection.hasMany(ReflectionComment, { foreignKey: 'reflectionId', as: 'comments', onDelete: 'CASCADE' });
ReflectionComment.belongsTo(Reflection, { foreignKey: 'reflectionId', as: 'reflection' });
User.hasMany(ReflectionComment, { foreignKey: 'userId', as: 'reflectionComments', onDelete: 'CASCADE' });
ReflectionComment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Reflection.hasMany(ReflectionLike, { foreignKey: 'reflectionId', as: 'likes', onDelete: 'CASCADE' });
ReflectionLike.belongsTo(Reflection, { foreignKey: 'reflectionId', as: 'reflection' });
User.hasMany(ReflectionLike, { foreignKey: 'userId', as: 'reflectionLikes', onDelete: 'CASCADE' });
ReflectionLike.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Badge, { foreignKey: 'userId', as: 'badges' });
Badge.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Song.hasMany(TriviaQuestion, { foreignKey: 'songId', as: 'triviaQuestions' });
TriviaQuestion.belongsTo(Song, { foreignKey: 'songId', as: 'song' });
TriviaQuestion.hasMany(TriviaAttempt, { foreignKey: 'questionId', as: 'attempts' });
TriviaAttempt.belongsTo(TriviaQuestion, { foreignKey: 'questionId', as: 'question' });
User.hasMany(TriviaAttempt, { foreignKey: 'userId', as: 'triviaAttempts' });
TriviaAttempt.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Song.hasMany(GenerationJob, { foreignKey: 'songId', as: 'generationJobs' });
GenerationJob.belongsTo(Song, { foreignKey: 'songId', as: 'song' });

Song.hasMany(SceneSegment, { foreignKey: 'songId', as: 'sceneSegments' });
SceneSegment.belongsTo(Song, { foreignKey: 'songId', as: 'song' });
SceneSegment.hasMany(GeneratedFrame, { foreignKey: 'sceneSegmentId', as: 'generatedFrames' });
GeneratedFrame.belongsTo(SceneSegment, { foreignKey: 'sceneSegmentId', as: 'sceneSegment' });

Song.belongsToMany(Instrument, {
    through: SongInstrument,
    foreignKey: 'songId',
    otherKey: 'instrumentId',
    as: 'instruments',
});
Instrument.belongsToMany(Song, {
    through: SongInstrument,
    foreignKey: 'instrumentId',
    otherKey: 'songId',
    as: 'songs',
});

User.hasMany(CreatorApplication, { foreignKey: 'userId', as: 'creatorApplications' });
CreatorApplication.belongsTo(User, { foreignKey: 'userId', as: 'applicant' });
User.hasMany(CreatorApplication, { foreignKey: 'reviewedBy', as: 'reviewedCreatorApplications' });
CreatorApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
CreatorApplication.hasMany(CreatorApplicationHistory, { foreignKey: 'applicationId', as: 'history' });
CreatorApplicationHistory.belongsTo(CreatorApplication, { foreignKey: 'applicationId', as: 'application' });
CreatorApplicationHistory.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

Song.belongsToMany(Folder, {
    through: SongFolder,
    foreignKey: 'songId',
    otherKey: 'folderId',
    as: 'folders',
});
Folder.belongsToMany(Song, {
    through: SongFolder,
    foreignKey: 'folderId',
    otherKey: 'songId',
    as: 'songs',
});
User.hasMany(Folder, { foreignKey: 'createdBy', as: 'createdFolders' });
Folder.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
User.hasMany(Folder, { foreignKey: 'proposedBy', as: 'folderProposals' });
Folder.belongsTo(User, { foreignKey: 'proposedBy', as: 'proposer' });
User.hasMany(Folder, { foreignKey: 'reviewedBy', as: 'reviewedFolders' });
Folder.belongsTo(User, { foreignKey: 'reviewedBy', as: 'folderReviewer' });

Song.hasMany(FolderSongProposal, { foreignKey: 'songId', as: 'folderPlacementProposals' });
FolderSongProposal.belongsTo(Song, { foreignKey: 'songId', as: 'song' });
Folder.hasMany(FolderSongProposal, { foreignKey: 'folderId', as: 'songPlacementProposals' });
FolderSongProposal.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
User.hasMany(FolderSongProposal, { foreignKey: 'proposedBy', as: 'folderSongProposals' });
FolderSongProposal.belongsTo(User, { foreignKey: 'proposedBy', as: 'proposer' });
FolderSongProposal.belongsTo(User, { foreignKey: 'reviewedBy', as: 'proposalReviewer' });

User.hasMany(UserWarning, { foreignKey: 'userId', as: 'warnings' });
UserWarning.belongsTo(User, { foreignKey: 'userId', as: 'warnedUser' });
UserWarning.belongsTo(User, { foreignKey: 'issuedBy', as: 'issuer' });
UserWarning.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolver' });
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserWarning.hasMany(Notification, { foreignKey: 'warningId', as: 'notifications' });
Notification.belongsTo(UserWarning, { foreignKey: 'warningId', as: 'warning' });

ModerationFlag.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });
ModerationFlag.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ModerationFlag.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });

ModerationAction.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
ModerationAction.belongsTo(User, { foreignKey: 'targetUserId', as: 'targetUser' });
ModerationAction.belongsTo(Song, { foreignKey: 'songId', as: 'song' });

AuditLog.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });
AuditLog.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });
AuditLog.belongsTo(Song, { foreignKey: 'songId', as: 'song' });

Song.hasMany(AnalyticsEvent, { foreignKey: 'songId', as: 'analyticsEvents' });
AnalyticsEvent.belongsTo(Song, { foreignKey: 'songId', as: 'song' });
Folder.hasMany(AnalyticsEvent, { foreignKey: 'folderId', as: 'analyticsEvents' });
AnalyticsEvent.belongsTo(Folder, { foreignKey: 'folderId', as: 'folder' });
User.hasMany(AnalyticsEvent, { foreignKey: 'userId', as: 'analyticsEvents' });
AnalyticsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
    sequelize,
    User,
    Session,
    Song,
    Instrument,
    Lesson,
    GameScore,
    Reflection,
    Badge,
    TriviaQuestion,
    TriviaAttempt,
    GenerationJob,
    SceneSegment,
    GeneratedFrame,
    SongInstrument,
    RhythmBeatmap,
    CreatorApplication,
    Folder,
    SongFolder,
    UserWarning,
    ModerationAction,
    AuditLog,
    CreatorApplicationHistory,
    FolderSongProposal,
    AnalyticsEvent,
    AuthOtp,
    AuthIdentity,
    CreatorProfile,
    UserProfile,
    ReflectionComment,
    ReflectionLike,
    Notification,
    ModerationFlag,
};
