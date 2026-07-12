const express = require('express');
const { Op } = require('sequelize');
const { GameScore, Song, User } = require('../models');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();
const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function expectedRank(accuracy) {
    if (accuracy >= 95) return 'S';
    if (accuracy >= 85) return 'A';
    if (accuracy >= 70) return 'B';
    return 'C';
}

router.post('/', optionalAuth, async (req, res, next) => {
    try {
        const { accuracy, difficulty = 'EASY', maxCombo = 0, score, songId, totalNotes } = req.body;
        const normalizedDifficulty = String(difficulty).toUpperCase();
        if (!songId || !UUID_PATTERN.test(songId)) return res.status(400).json({ message: 'songId must be a valid song id' });
        if (!Number.isInteger(score) || score < 0) return res.status(400).json({ message: 'score must be a non-negative integer' });
        if (typeof accuracy !== 'number' || !Number.isFinite(accuracy) || accuracy < 0 || accuracy > 100) return res.status(400).json({ message: 'accuracy must be between 0 and 100' });
        if (!Number.isInteger(totalNotes) || totalNotes < 1 || totalNotes > 10000) return res.status(400).json({ message: 'totalNotes must be an integer between 1 and 10000' });
        if (!Number.isInteger(maxCombo) || maxCombo < 0 || maxCombo > totalNotes) return res.status(400).json({ message: 'maxCombo must be between 0 and totalNotes' });
        if (!DIFFICULTIES.has(normalizedDifficulty)) return res.status(400).json({ message: 'difficulty must be EASY, MEDIUM, or HARD' });
        const theoreticalMaximum = (totalNotes * 1000) + (12 * totalNotes * (totalNotes + 1) / 2);
        if (score > theoreticalMaximum) return res.status(400).json({ message: 'score exceeds the maximum possible value for this chart' });

        const song = await Song.findOne({ where: { creatorId: { [Op.ne]: null }, id: songId, status: 'PUBLISHED' }, attributes: ['id'] });
        if (!song) return res.status(404).json({ message: 'Published song not found.' });

        const suppliedAuthorization = Boolean(req.get('authorization'));
        if (suppliedAuthorization && !req.authUser?.id) return res.status(401).json({ message: 'Your session is invalid or expired.' });
        if (!req.authUser?.id) return res.status(204).end();

        const user = await User.findByPk(req.authUser.id, { attributes: ['id', 'role'] });
        if (!user) return res.status(401).json({ message: 'Your account could not be found.' });
        if (user.role !== 'REGISTERED') return res.status(403).json({ message: 'Registered player access is required to save scores.' });

        const gameScore = await GameScore.create({
            accuracy, difficulty: normalizedDifficulty, maxCombo,
            rank: expectedRank(accuracy), score, songId: song.id, userId: user.id,
        });
        return res.status(201).json({ score: gameScore });
    } catch (error) { return next(error); }
});

module.exports = router;
