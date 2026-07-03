const express = require('express');
const fs = require('fs/promises');
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

router.post('/lyrics', async (req, res, next) => {
    try {
        const { fileName, mediaBase64, mimeType, youtubeUrl } = req.body;

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

        const result = await transcribeMedia({ fileName, mediaBase64, mimeType });
        return res.json(result);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
