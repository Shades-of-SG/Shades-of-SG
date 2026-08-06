const express = require('express');
const { Op } = require('sequelize');
const {
    AnalyticsEvent, Folder, Song,
} = require('../models');
const { optionalAuth, requireCreator } = require('../middleware/auth');
const { isUuid } = require('../middleware/validateUuid');
const { creatorAnalyticsSummary } = require('../services/creatorAnalyticsService');

const router = express.Router();
const EVENT_TYPES = new Set([
    'SONG_PAGE_VIEWED', 'SONG_PLAYBACK_STARTED', 'SONG_PLAYBACK_COMPLETED',
    'RHYTHM_GAME_STARTED', 'RHYTHM_GAME_COMPLETED',
    'TRIVIA_STARTED', 'TRIVIA_COMPLETED', 'REFLECTION_SUBMITTED', 'FOLDER_VIEWED',
]);
const CLIENT_EVENT_TYPES = new Set([...EVENT_TYPES].filter((type) => type !== 'REFLECTION_SUBMITTED'));
const SAFE_METADATA_FIELDS = new Set([
    'accuracy', 'completionPercent', 'correctAnswers', 'difficulty', 'durationSeconds', 'score', 'totalQuestions',
]);

function safeMetadata(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value)
        .filter(([key, item]) => SAFE_METADATA_FIELDS.has(key)
            && (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'))
        .map(([key, item]) => [key, typeof item === 'string' ? item.slice(0, 100) : item]));
}

router.post('/events', optionalAuth, async (req, res, next) => {
    try {
        const eventType = String(req.body.eventType || '').toUpperCase();
        if (!CLIENT_EVENT_TYPES.has(eventType)) {
            return res.status(400).json({ message: 'Unsupported analytics event type.' });
        }

        let songId = null;
        let folderId = null;
        if (eventType === 'FOLDER_VIEWED') {
            const folder = await Folder.findOne({ where: { id: req.body.folderId, status: 'APPROVED' }, attributes: ['id'] });
            if (!folder) return res.status(404).json({ message: 'Folder not found.' });
            folderId = folder.id;
        } else {
            if (!isUuid(req.body.songId)) {
                return res.status(400).json({ message: 'songId must be a valid song ID.' });
            }
            const song = await Song.findOne({
                where: { id: req.body.songId, creatorId: { [Op.ne]: null }, status: 'PUBLISHED' },
                attributes: ['id'],
            });
            if (!song) return res.status(404).json({ message: 'Song not found.' });
            songId = song.id;
        }

        await AnalyticsEvent.create({
            eventType,
            folderId,
            metadata: safeMetadata(req.body.metadata),
            songId,
            // Identity is always derived from the verified token; client userId is ignored.
            userId: req.authUserRecord?.id || null,
        });
        return res.status(202).json({ accepted: true });
    } catch (error) { return next(error); }
});

router.get('/creator', requireCreator, async (req, res, next) => {
    try {
        const creatorId = req.authUserRecord.id;
        const songId = String(req.query.songId || '').trim() || null;
        if (songId && !isUuid(songId)) {
            return res.status(400).json({ message: 'songId must be a valid song ID.' });
        }
        if (songId) {
            const ownedSong = await Song.findOne({ where: { creatorId, id: songId }, attributes: ['id'] });
            if (!ownedSong) return res.status(404).json({ message: 'Song not found.' });
        }
        return res.json(await creatorAnalyticsSummary(creatorId, songId));
    } catch (error) { return next(error); }
});

module.exports = router;
