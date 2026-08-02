const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { Song } = require('../models');
const { requireCreator } = require('../middleware/auth');
const {
    extractAudioFromYouTube,
    getAudioExtractionConfigStatus,
} = require('../services/audioExtractionService');
const {
    getTranscriptionConfigStatus,
    transcribeMedia,
    transcribeMediaBuffer,
} = require('../services/transcriptionService');

const router = express.Router();

router.get('/status', (req, res) => {
    res.json({
        ...getTranscriptionConfigStatus(),
        youtubeExtraction: getAudioExtractionConfigStatus(),
    });
});

router.post('/lyrics', requireCreator, async (req, res, next) => {
    try {
        const { fileName, mediaBase64, mimeType, songId, youtubeUrl } = req.body;

        if (youtubeUrl && !mediaBase64) {
            const extractedAudio = await extractAudioFromYouTube(youtubeUrl);

            try {
                const mediaBuffer = await fs.readFile(extractedAudio.filePath);
                const result = await transcribeMediaBuffer({
                    fileName: extractedAudio.fileName,
                    mediaBuffer,
                    mimeType: extractedAudio.mimeType,
                });

                return res.json({
                    ...result,
                    source: 'youtube',
                });
            } finally {
                await extractedAudio.cleanup();
            }
        }

        if (songId && !mediaBase64) {
            const song = await Song.findOne({ where: { creatorId: req.authUserRecord.id, id: songId } });
            if (!song) return res.status(404).json({ message: 'Song not found.' });
            const mediaUrl = song.videoUrl || song.audioUrl;
            if (!mediaUrl) return res.status(400).json({ message: 'Upload song media before extracting lyrics.' });

            const url = new URL(mediaUrl);
            if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
                return res.status(400).json({ message: 'Saved media must be hosted on Cloudinary before transcription.' });
            }

            const mediaResponse = await fetch(mediaUrl);
            if (!mediaResponse.ok) {
                const error = new Error('Unable to download the saved media for transcription.');
                error.status = 502;
                throw error;
            }
            const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
            const result = await transcribeMediaBuffer({
                fileName: path.basename(url.pathname) || 'uploaded-media.mp4',
                mediaBuffer,
                mimeType: mediaResponse.headers.get('content-type')?.split(';')[0] || 'video/mp4',
            });
            return res.json({ ...result, source: 'saved-media' });
        }

        const result = await transcribeMedia({ fileName, mediaBase64, mimeType });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
