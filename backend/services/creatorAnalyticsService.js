const { fn, col } = require('sequelize');
const {
    AnalyticsEvent, GameScore, GenerationJob, Reflection, Song,
} = require('../models');

const EVENT_TYPES = new Set([
    'SONG_PAGE_VIEWED', 'SONG_PLAYBACK_STARTED', 'SONG_PLAYBACK_COMPLETED',
    'RHYTHM_GAME_STARTED', 'RHYTHM_GAME_COMPLETED',
    'TRIVIA_STARTED', 'TRIVIA_COMPLETED', 'REFLECTION_SUBMITTED', 'FOLDER_VIEWED',
]);

async function countThroughOwnedSong(Model, creatorId, options = {}) {
    return Model.count({
        ...options,
        distinct: true,
        include: [{ model: Song, as: 'song', attributes: [], required: true, where: { creatorId } }],
    });
}

async function groupedOwnedEvents(creatorId, songId) {
    const rows = await AnalyticsEvent.findAll({
        attributes: ['eventType', [fn('COUNT', col('AnalyticsEvent.id')), 'count']],
        include: [{
            model: Song,
            as: 'song',
            attributes: [],
            required: true,
            where: { creatorId, ...(songId ? { id: songId } : {}) },
        }],
        group: ['eventType'],
        raw: true,
    });
    return Object.fromEntries(EVENT_TYPES.values().map((type) => [
        type,
        Number(rows.find((row) => row.eventType === type)?.count || 0),
    ]));
}

// Shared by the creator's own analytics route (backend/routes/analytics.js) and
// the admin "Creator-side data" view (backend/routes/admin.js) so both surfaces
// compute these numbers identically.
async function creatorAnalyticsSummary(creatorId, songId = null) {
    const ownedSongWhere = { creatorId, ...(songId ? { id: songId } : {}) };
    const statuses = ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'];
    const reflectionStatuses = ['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'];
    const [songCounts, scoreCount, reflectionCounts, generationCounts, events] = await Promise.all([
        Promise.all(statuses.map(async (status) => [status, await Song.count({ where: { ...ownedSongWhere, status } })])),
        countThroughOwnedSong(GameScore, creatorId, songId ? { where: { songId } } : {}),
        Promise.all(reflectionStatuses.map(async (status) => [status, await countThroughOwnedSong(Reflection, creatorId, { where: { status, ...(songId ? { songId } : {}) } })])),
        Promise.all(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'].map(async (status) => [status, await countThroughOwnedSong(GenerationJob, creatorId, { where: { status, ...(songId ? { songId } : {}) } })])),
        groupedOwnedEvents(creatorId, songId),
    ]);
    const songs = Object.fromEntries(songCounts);
    return {
        events,
        generationJobs: Object.fromEntries(generationCounts),
        reflections: Object.fromEntries(reflectionCounts),
        rhythmScores: scoreCount,
        songs: { ...songs, total: Object.values(songs).reduce((sum, value) => sum + value, 0) },
    };
}

module.exports = { countThroughOwnedSong, creatorAnalyticsSummary, groupedOwnedEvents };
