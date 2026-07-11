const fs = require('fs');
const { Op } = require('sequelize');
const { Song, GenerationJob } = require('../models');
const aiStorageService = require('../services/aiStorageService');
const audioExtractionService = require('../services/audioExtractionService');
const cloudinaryService = require('../services/cloudinaryService');

const SONG_STATUSES = new Set(['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']);
const EDITABLE_FIELDS = [
    'title', 'artist', 'description', 'theme', 'languages', 'otherLanguages', 'moodTags',
    'rawLyrics', 'coverImageUrl', 'coverImagePublicId', 'audioUrl', 'audioPublicId',
    'sourceYoutubeUrl', 'videoUrl', 'videoPublicId', 'durationSecs',
];

function normalizeArray(value) {
    if (value === undefined) return undefined;
    if (typeof value === 'string') {
        try { value = JSON.parse(value); } catch { return null; }
    }
    if (!Array.isArray(value)) return null;
    return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function buildSongValues(body, { partial = false } = {}) {
    const values = {};
    for (const field of EDITABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(body, field)) values[field] = body[field];
    }
    // Transitional request aliases used by the existing backend clients.
    if (body.lyrics !== undefined && body.rawLyrics === undefined) values.rawLyrics = body.lyrics;
    if (body.youtubeUrl !== undefined && body.sourceYoutubeUrl === undefined) values.sourceYoutubeUrl = body.youtubeUrl;
    if (body.language !== undefined && body.languages === undefined) values.languages = [body.language];

    for (const field of ['languages', 'otherLanguages', 'moodTags']) {
        if (values[field] !== undefined) values[field] = normalizeArray(values[field]);
        if (values[field] === null) return { error: `${field} must be an array.` };
    }
    if (!partial && !String(values.title || '').trim()) return { error: 'Song title is required.' };
    if (values.title !== undefined) {
        values.title = String(values.title).trim();
        if (!values.title) return { error: 'Song title is required.' };
        if (values.title.length > 255) return { error: 'Song title must be 255 characters or fewer.' };
    }
    if (values.durationSecs !== undefined && values.durationSecs !== null) {
        const duration = Number(values.durationSecs);
        if (!Number.isInteger(duration) || duration < 0) return { error: 'durationSecs must be a non-negative integer.' };
        values.durationSecs = duration;
    }
    return { values };
}

function publishValidation(song) {
    const missing = [];
    if (!song.title?.trim()) missing.push('title');
    if (!song.artist?.trim()) missing.push('artist');
    if (!song.description?.trim()) missing.push('description');
    if (!song.theme?.trim()) missing.push('theme');
    if (!Array.isArray(song.languages) || song.languages.length === 0) missing.push('languages');
    if (!song.rawLyrics?.trim()) missing.push('rawLyrics');
    if (!song.coverImageUrl?.trim()) missing.push('coverImageUrl');
    if (!song.audioUrl?.trim()) missing.push('audioUrl');
    if (!song.videoUrl?.trim()) missing.push('videoUrl');
    if (song.status !== 'READY') missing.push('status READY');
    return missing;
}

async function findOwnedSong(req) {
    return Song.findOne({ where: { id: req.params.id, creatorId: req.authUserRecord.id } });
}

async function listPublicSongs(req, res, next) {
    try {
        const where = { status: 'PUBLISHED' };
        if (req.query.theme) where.theme = req.query.theme;
        if (req.query.language) where.languages = { [Op.contains]: [req.query.language] };
        const songs = await Song.findAll({ where, order: [['publishedDate', 'DESC'], ['title', 'ASC']] });
        return res.json({ songs });
    } catch (error) { return next(error); }
}

async function getPublicSong(req, res, next) {
    try {
        const song = await Song.findOne({ where: { id: req.params.id, status: 'PUBLISHED' } });
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function listCreatorSongs(req, res, next) {
    try {
        const where = { creatorId: req.authUserRecord.id };
        if (req.query.status) {
            const status = String(req.query.status).toUpperCase();
            if (!SONG_STATUSES.has(status)) return res.status(400).json({ message: 'Invalid song status.' });
            where.status = status;
        }
        const songs = await Song.findAll({ where, order: [['updatedAt', 'DESC']] });
        return res.json({ songs });
    } catch (error) { return next(error); }
}

async function getCreatorSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function createSong(req, res, next) {
    try {
        const parsed = buildSongValues(req.body);
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        let { audioUrl, audioPublicId, durationSecs } = parsed.values;
        if (req.file) {
            const uploaded = await aiStorageService.uploadAudioStream(req.file.buffer);
            audioUrl = uploaded.audioUrl;
            audioPublicId = uploaded.audioPublicId;
            durationSecs = uploaded.duration;
        } else if (parsed.values.sourceYoutubeUrl && !audioUrl) {
            const extracted = await audioExtractionService.extractAudioFromYouTube(parsed.values.sourceYoutubeUrl);
            try {
                const uploaded = await aiStorageService.uploadAudioStream(fs.createReadStream(extracted.filePath));
                audioUrl = uploaded.audioUrl;
                audioPublicId = uploaded.audioPublicId;
                durationSecs = uploaded.duration;
            } finally { await extracted.cleanup(); }
        }
        const song = await Song.create({
            ...parsed.values, audioUrl, audioPublicId, durationSecs,
            creatorId: req.authUserRecord.id, status: 'DRAFT', publishedDate: null,
        });
        return res.status(201).json({ success: true, data: song, song });
    } catch (error) { return next(error); }
}

async function updateSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status === 'GENERATING') return res.status(409).json({ message: 'A generating song cannot be edited.' });
        const parsed = buildSongValues(req.body, { partial: true });
        if (parsed.error) return res.status(400).json({ message: parsed.error });
        await song.update(parsed.values);
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function publishSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        const latestJob = await GenerationJob.findOne({ where: { songId: song.id }, order: [['createdAt', 'DESC']] });
        const missing = publishValidation(song);
        if (!latestJob || latestJob.status !== 'COMPLETED') missing.push('completed generation job');
        if (missing.length) return res.status(400).json({ message: 'Song is not ready to publish.', missing });
        await song.update({ status: 'PUBLISHED', publishedDate: new Date() });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function getPublishReadiness(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        const latestJob = await GenerationJob.findOne({ where: { songId: song.id }, order: [['createdAt', 'DESC']] });
        const missing = publishValidation(song);
        if (!latestJob || latestJob.status !== 'COMPLETED') missing.push('completed generation job');
        return res.json({ ready: missing.length === 0, missing, songStatus: song.status, generationStatus: latestJob?.status || null });
    } catch (error) { return next(error); }
}

async function uploadCoverImage(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (!req.file) return res.status(400).json({ message: 'Cover image is required.' });
        const previousPublicId = song.coverImagePublicId;
        const uploaded = await cloudinaryService.uploadImageBuffer(req.file.buffer);
        await song.update({ coverImageUrl: uploaded.secure_url, coverImagePublicId: uploaded.public_id });
        if (previousPublicId && previousPublicId !== uploaded.public_id) {
            await cloudinaryService.deleteImage(previousPublicId).catch((error) => {
                console.error(`Unable to delete replaced cover ${previousPublicId}:`, error.message);
            });
        }
        return res.json({ song, coverImageUrl: song.coverImageUrl, coverImagePublicId: song.coverImagePublicId });
    } catch (error) { return next(error); }
}

async function uploadSongAudio(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (!req.file) return res.status(400).json({ message: 'Audio file is required.' });
        const uploaded = await aiStorageService.uploadAudioStream(req.file.buffer);
        await song.update({
            audioUrl: uploaded.audioUrl,
            audioPublicId: uploaded.audioPublicId,
            durationSecs: uploaded.duration,
        });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function unpublishSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status !== 'PUBLISHED') return res.status(409).json({ message: 'Only a published song can be unpublished.' });
        await song.update({ status: 'READY', publishedDate: null });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function extractAudio(req, res, next) {
    try {
        if (!req.body.youtubeUrl) return res.status(400).json({ message: 'YouTube URL is required.' });
        const extracted = await audioExtractionService.extractAudioFromYouTube(req.body.youtubeUrl);
        try {
            const uploaded = await aiStorageService.uploadAudioStream(fs.createReadStream(extracted.filePath));
            return res.json({ success: true, ...uploaded });
        } finally { await extracted.cleanup(); }
    } catch (error) { return next(error); }
}

module.exports = { createSong, extractAudio, getCreatorSong, getPublicSong, getPublishReadiness, listCreatorSongs, listPublicSongs, publishSong, unpublishSong, updateSong, uploadCoverImage, uploadSongAudio };
