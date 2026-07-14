const fs = require('fs');
const { Op } = require('sequelize');
const { Song, GenerationJob, SceneSegment, GeneratedFrame } = require('../models');
const aiStorageService = require('../services/aiStorageService');
const audioExtractionService = require('../services/audioExtractionService');
const cloudinaryService = require('../services/cloudinaryService');

const SONG_STATUSES = new Set(['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']);
const ACTIVE_GENERATION_STATUSES = ['QUEUED', 'PROCESSING'];
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
    return missing;
}

function isUploadedVideoMedia(song) {
    const candidates = [song.audioFileName, song.audioUrl]
        .filter(Boolean)
        .map((value) => String(value).split(/[?#]/, 1)[0].toLowerCase());
    return candidates.some((value) => value.endsWith('.mp4') || value.endsWith('.webm'));
}

async function useUploadedMediaAsVideo(song) {
    if (!song.audioUrl?.trim() || !isUploadedVideoMedia(song)) return false;
    if (song.videoUrl?.trim() && song.videoUrl !== song.audioUrl) return false;

    await GenerationJob.update({
        status: 'FAILED',
        errorMessage: 'AI generation stopped because the creator chose the uploaded video.',
    }, { where: { songId: song.id, status: ACTIVE_GENERATION_STATUSES } });
    const values = {
        videoPublicId: song.audioPublicId || song.videoPublicId || null,
        videoUrl: song.audioUrl,
    };
    if (song.status === 'GENERATING') values.status = 'READY';
    await song.update(values);
    return true;
}

async function reconcileCompletedGeneration(song, latestJob) {
    if (latestJob?.status === 'COMPLETED' && song.videoUrl && ['DRAFT', 'GENERATING'].includes(song.status)) {
        await song.update({ status: 'READY' });
    }
    return song;
}

async function findOwnedSong(req) {
    return Song.findOne({ where: { id: req.params.id, creatorId: req.authUserRecord.id } });
}

async function listPublicSongs(req, res, next) {
    try {
        const where = { creatorId: { [Op.ne]: null }, status: 'PUBLISHED' };
        if (req.query.theme) where.theme = req.query.theme;
        const songs = await Song.findAll({ where, order: [['publishedDate', 'DESC'], ['title', 'ASC']] });
        const search = String(req.query.search || '').trim().toLowerCase();
        const language = String(req.query.language || '').trim().toLowerCase();
        const mood = String(req.query.mood || '').trim().toLowerCase();
        const filtered = songs.filter((song) => {
            const searchable = [song.title, song.artist, song.description, song.theme, ...(song.languages || [])]
                .filter(Boolean).join(' ').toLowerCase();
            const languages = (song.languages || []).map((value) => String(value).toLowerCase());
            const moods = (song.moodTags || []).map((value) => String(value).toLowerCase());
            return (!search || searchable.includes(search))
                && (!language || languages.includes(language))
                && (!mood || moods.includes(mood));
        });
        return res.json({ songs: filtered });
    } catch (error) { return next(error); }
}

async function getPublicSong(req, res, next) {
    try {
        const song = await Song.findOne({ where: { creatorId: { [Op.ne]: null }, id: req.params.id, status: 'PUBLISHED' } });
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
        const songs = await Song.findAll({
            where,
            include: [{ model: GenerationJob, as: 'generationJobs', required: false }],
            order: [['updatedAt', 'DESC']],
        });
        return res.json({ songs: songs.map(serializeCreatorSong) });
    } catch (error) { return next(error); }
}

function serializeCreatorSong(song) {
    const value = song.get({ plain: true });
    const jobs = [...(value.generationJobs || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const latestGenerationJob = jobs[0] || null;
    delete value.generationJobs;
    const missing = publishValidation(song);
    return { ...value, latestGenerationJob, publishReady: missing.length === 0, publishMissing: missing };
}

async function getCreatorDashboardSummary(req, res, next) {
    try {
        const creatorId = req.authUserRecord.id;
        const statuses = [...SONG_STATUSES];
        const [counts, recentSongs, recentJobs] = await Promise.all([
            Promise.all(statuses.map(async (status) => [status, await Song.count({ where: { creatorId, status } })])),
            Song.findAll({
                where: { creatorId }, limit: 5, order: [['updatedAt', 'DESC']],
                include: [{ model: GenerationJob, as: 'generationJobs', required: false }],
            }),
            GenerationJob.findAll({
                include: [{ model: Song, as: 'song', attributes: ['id', 'title', 'artist'], where: { creatorId } }],
                limit: 5, order: [['createdAt', 'DESC']],
            }),
        ]);
        const byStatus = Object.fromEntries(counts);
        return res.json({
            counts: { total: Object.values(byStatus).reduce((sum, count) => sum + count, 0), ...byStatus },
            recentSongs: recentSongs.map(serializeCreatorSong),
            generationJobs: recentJobs,
            playAnalyticsAvailable: false,
        });
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
        let audioFileName = null;
        let uploadedMediaIsVideo = false;
        if (req.file) {
            const uploaded = await aiStorageService.uploadAudioStream(req.file.buffer);
            audioUrl = uploaded.audioUrl;
            audioFileName = req.file.originalname;
            audioPublicId = uploaded.audioPublicId;
            durationSecs = uploaded.duration;
            uploadedMediaIsVideo = ['video/mp4', 'video/webm'].includes(req.file.mimetype);
        }
        const song = await Song.create({
            ...parsed.values, audioFileName, audioUrl, audioPublicId, durationSecs,
            creatorId: req.authUserRecord.id,
            publishedDate: null,
            status: uploadedMediaIsVideo ? 'READY' : 'DRAFT',
            videoPublicId: uploadedMediaIsVideo ? audioPublicId : parsed.values.videoPublicId,
            videoUrl: uploadedMediaIsVideo ? audioUrl : parsed.values.videoUrl,
        });
        return res.status(201).json({ success: true, data: song, song });
    } catch (error) { return next(error); }
}

async function updateSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
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
        const usedUploadedMedia = await useUploadedMediaAsVideo(song);
        if (usedUploadedMedia && latestJob) await latestJob.reload();
        await reconcileCompletedGeneration(song, latestJob);
        const missing = publishValidation(song);
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
        const usedUploadedMedia = await useUploadedMediaAsVideo(song);
        if (usedUploadedMedia && latestJob) await latestJob.reload();
        await reconcileCompletedGeneration(song, latestJob);
        const missing = publishValidation(song);
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
        const uploadedMediaIsVideo = ['video/mp4', 'video/webm'].includes(req.file.mimetype);
        if (uploadedMediaIsVideo) {
            await GenerationJob.update({
                status: 'FAILED',
                errorMessage: 'AI generation stopped because the creator uploaded a finished video.',
            }, { where: { songId: song.id, status: ACTIVE_GENERATION_STATUSES } });
        }
        await song.update({
            audioFileName: req.file.originalname,
            audioUrl: uploaded.audioUrl,
            audioPublicId: uploaded.audioPublicId,
            durationSecs: uploaded.duration,
            ...(uploadedMediaIsVideo ? {
                status: song.status === 'PUBLISHED' ? 'PUBLISHED' : 'READY',
                videoPublicId: uploaded.audioPublicId,
                videoUrl: uploaded.audioUrl,
            } : {}),
        });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function uploadSongVideo(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (!req.file) return res.status(400).json({ message: 'Choose an MP4 or WebM video to upload.' });
        const previousPublicId = song.videoPublicId;
        const uploaded = await aiStorageService.uploadVideoStream(req.file.buffer);
        await GenerationJob.update({
            status: 'FAILED',
            errorMessage: 'AI generation stopped because the creator uploaded a finished video.',
        }, { where: { songId: song.id, status: ACTIVE_GENERATION_STATUSES } });
        await song.update({
            status: song.status === 'PUBLISHED' ? 'PUBLISHED' : 'READY',
            videoPublicId: uploaded.videoPublicId,
            videoUrl: uploaded.videoUrl,
        });
        if (previousPublicId && previousPublicId !== uploaded.videoPublicId && previousPublicId !== song.audioPublicId) {
            await cloudinaryService.deleteAsset(previousPublicId, 'video').catch((error) => {
                console.error(`Unable to delete replaced video ${previousPublicId}:`, error.message);
            });
        }
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

async function archiveSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status === 'GENERATING') return res.status(409).json({ message: 'A generating song cannot be archived.' });
        await song.update({ status: 'ARCHIVED', publishedDate: null });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function unarchiveSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status !== 'ARCHIVED') return res.status(409).json({ message: 'Only an archived song can be restored.' });
        await song.update({
            status: song.videoUrl?.trim() ? 'READY' : 'DRAFT',
            publishedDate: null,
        });
        return res.json({ song });
    } catch (error) { return next(error); }
}

async function deleteSong(req, res, next) {
    try {
        const song = await findOwnedSong(req);
        if (!song) return res.status(404).json({ message: 'Song not found.' });
        if (song.status === 'GENERATING') return res.status(409).json({ message: 'A generating song cannot be deleted.' });
        const segments = await SceneSegment.findAll({
            where: { songId: song.id },
            include: [{ model: GeneratedFrame, as: 'generatedFrames', required: false }],
        });
        const assets = [
            [song.coverImagePublicId, 'image'],
            [song.audioPublicId, 'video'],
            [song.videoPublicId, 'video'],
            ...segments.flatMap((segment) => segment.generatedFrames.map((frame) => [frame.cloudinaryId, 'image'])),
        ].filter(([publicId]) => publicId);
        await song.destroy();
        const cleanup = await Promise.allSettled(assets.map(([publicId, type]) => cloudinaryService.deleteAsset(publicId, type)));
        const cleanupFailures = cleanup.filter((result) => result.status === 'rejected').length;
        return res.json({ deleted: true, id: song.id, cleanupFailures });
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

module.exports = { archiveSong, createSong, deleteSong, extractAudio, getCreatorDashboardSummary, getCreatorSong, getPublicSong, getPublishReadiness, listCreatorSongs, listPublicSongs, publishSong, unarchiveSong, unpublishSong, updateSong, uploadCoverImage, uploadSongAudio, uploadSongVideo };
