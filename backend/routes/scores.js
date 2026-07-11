const express = require('express');
const { GameScore } = require('../models');

const router = express.Router();
const DIFFICULTIES = new Set(['EASY', 'MEDIUM', 'HARD']);
const RANKS = new Set(['S', 'A', 'B', 'C']);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isNonNegativeInteger(value) {
    return Number.isInteger(value) && value >= 0;
}

function isValidAccuracy(value) {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

router.post('/', async (req, res, next) => {
    try {
        const {
            accuracy,
            difficulty = 'EASY',
            maxCombo = 0,
            rank = 'C',
            score,
            songId,
            userId = null,
        } = req.body;
        const normalizedDifficulty = String(difficulty).toUpperCase();
        const normalizedRank = String(rank).toUpperCase();

        if (!songId) {
            return res.status(400).json({ message: 'songId is required' });
        }

        if (!UUID_PATTERN.test(songId)) {
            return res.status(400).json({ message: 'songId must be a valid song id' });
        }

        if (!isNonNegativeInteger(score)) {
            return res.status(400).json({ message: 'score must be a non-negative integer' });
        }

        if (!isValidAccuracy(accuracy)) {
            return res.status(400).json({ message: 'accuracy must be between 0 and 100' });
        }

        if (!isNonNegativeInteger(maxCombo)) {
            return res.status(400).json({ message: 'maxCombo must be a non-negative integer' });
        }

        if (!DIFFICULTIES.has(normalizedDifficulty)) {
            return res.status(400).json({ message: 'difficulty must be EASY, MEDIUM, or HARD' });
        }

        if (!RANKS.has(normalizedRank)) {
            return res.status(400).json({ message: 'rank must be S, A, B, or C' });
        }

        const gameScore = await GameScore.create({
            accuracy,
            difficulty: normalizedDifficulty,
            maxCombo,
            rank: normalizedRank,
            score,
            songId,
            userId,
        });

        return res.status(201).json({ score: gameScore });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
