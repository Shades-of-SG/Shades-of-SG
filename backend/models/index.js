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

User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Song, { foreignKey: 'creatorId', as: 'songs' });
Song.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

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
};
