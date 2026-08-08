const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { Song } = require('../models');
const { requireCreator } = require('../middleware/auth');
const { isUuid } = require('../middleware/validateUuid');
const {
    extractAudioFromYouTube,
    getAudioExtractionConfigStatus,
} = require('../services/audioExtractionService');
const {
    getTranscriptionConfigStatus,
    transcribeMedia,
    transcribeMediaBuffer,
} = require('../services/transcriptionService');
const { getDeepSeekConfigStatus } = require('../services/deepseekClient');
const { formatSongSectionsLyrics, recommendSongSections } = require('../services/songSectionService');

const router = express.Router();

router.get('/status', (req, res) => {
    res.json({
        ...getTranscriptionConfigStatus(),
        sectionAnalysis: getDeepSeekConfigStatus(),
        youtubeExtraction: getAudioExtractionConfigStatus(),
    });
});

async function addSectionRecommendations(result, song = null) {
    if (song?.sectionRecommendationsConfirmedAt && Array.isArray(song.sectionRecommendations)) {
        const lyrics = formatSongSectionsLyrics(song.sectionRecommendations);
        await song.update({ rawLyrics: lyrics, transcriptionSegments: result.segments });
        return {
            ...result,
            lyrics,
            sectionRecommendations: song.sectionRecommendations,
            sectionRecommendationsConfirmedAt: song.sectionRecommendationsConfirmedAt,
        };
    }

    const sectionRecommendations = await recommendSongSections({
        durationSecs: song?.durationSecs,
        segments: result.segments || [],
    });
    const lyrics = formatSongSectionsLyrics(sectionRecommendations);
    if (song) {
        await song.update({
            rawLyrics: lyrics,
            sectionRecommendations,
            sectionRecommendationsConfirmedAt: null,
            transcriptionSegments: result.segments,
        });
    }
    return { ...result, lyrics, sectionRecommendations, sectionRecommendationsConfirmedAt: null };
}

router.post('/lyrics', requireCreator, async (req, res, next) => {
    try {
        const { fileName, includeSectionRecommendations, mediaBase64, mimeType, songId, youtubeUrl } = req.body;
        let ownedSong = null;
        if (songId) {
            if (!isUuid(songId)) return res.status(400).json({ message: 'Song ID must be a valid UUID.' });
            ownedSong = await Song.findOne({ where: { creatorId: req.authUserRecord.id, id: songId } });
            if (!ownedSong) return res.status(404).json({ message: 'Song not found.' });
        }
        const finalize = (result) => includeSectionRecommendations === true
            ? addSectionRecommendations(result, ownedSong)
            : result;

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
                    ...await finalize(result),
                    source: 'youtube',
                });
            } finally {
                await extractedAudio.cleanup();
            }
        }

        if (songId && !mediaBase64) {
            const mediaUrl = ownedSong.videoUrl || ownedSong.audioUrl;
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
            return res.json({ ...await finalize(result), source: 'saved-media' });
        }

        const result = await transcribeMedia({ fileName, mediaBase64, mimeType });
        return res.json(await finalize(result));
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
