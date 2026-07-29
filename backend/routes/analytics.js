const express = require('express');
const { GenerationJob, GameScore, Reflection, Song } = require('../models');
const { requireCreator } = require('../middleware/auth');

const router = express.Router();

async function countThroughOwnedSong(Model, creatorId, options = {}) {
    return Model.count({
        ...options,
        distinct: true,
        include: [{ model: Song, as: 'song', attributes: [], required: true, where: { creatorId } }],
    });
}

router.get('/creator', requireCreator, async (req, res, next) => {
    try {
        const creatorId = req.authUserRecord.id;
        const statuses = ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'];
        const reflectionStatuses = ['PENDING', 'APPROVED', 'FLAGGED', 'REJECTED'];
        const [songCounts, scoreCount, reflectionCounts, generationCounts] = await Promise.all([
            Promise.all(statuses.map(async (status) => [status, await Song.count({ where: { creatorId, status } })])),
            countThroughOwnedSong(GameScore, creatorId),
            Promise.all(reflectionStatuses.map(async (status) => [status, await countThroughOwnedSong(Reflection, creatorId, { where: { status } })])),
            Promise.all(['QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'].map(async (status) => [status, await countThroughOwnedSong(GenerationJob, creatorId, { where: { status } })])),
        ]);
        const songs = Object.fromEntries(songCounts);
        return res.json({
            generationJobs: Object.fromEntries(generationCounts),
            reflections: Object.fromEntries(reflectionCounts),
            rhythmScores: scoreCount,
            songs: { ...songs, total: Object.values(songs).reduce((sum, value) => sum + value, 0) },
        });
    } catch (error) { return next(error); }
});

module.exports = router;

