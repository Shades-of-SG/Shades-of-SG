const express = require('express');
const multer = require('multer');
const songController = require('../controllers/songController');
const { requireCreator } = require('../middleware/auth');

const router = express.Router();
const SUPPORTED_MEDIA_MIME_TYPES = new Set([
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/wav',
    'audio/x-wav',
    'audio/webm',
    'video/mp4',
    'video/webm',
]);
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, callback) {
        if (SUPPORTED_MEDIA_MIME_TYPES.has(file.mimetype)) return callback(null, true);
        const error = new Error('Invalid file type. Use MP3, WAV, M4A, WebM, or MP4.');
        error.statusCode = 400;
        return callback(error, false);
    },
    limits: { fileSize: 50 * 1024 * 1024 },
});
const coverUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, callback) {
        if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) return callback(null, true);
        const error = new Error('Invalid cover image type. Use JPG, PNG, or WebP.');
        error.statusCode = 400;
        return callback(error, false);
    },
    limits: { fileSize: 10 * 1024 * 1024 },
});
const videoUpload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, callback) {
        if (['video/mp4', 'video/webm'].includes(file.mimetype)) return callback(null, true);
        const error = new Error('Please upload an MP4 or WebM video.');
        error.statusCode = 400;
        return callback(error, false);
    },
    limits: { fileSize: 100 * 1024 * 1024 },
});

router.get('/creator', requireCreator, songController.listCreatorSongs);
router.get('/creator/dashboard/summary', requireCreator, songController.getCreatorDashboardSummary);
router.get('/creator/:id', requireCreator, songController.getCreatorSong);
router.post('/extract-audio', requireCreator, songController.extractAudio);
router.post('/', requireCreator, upload.single('audioFile'), songController.createSong);
router.put('/:id/metadata', requireCreator, songController.updateSong);
router.post('/:id/audio', requireCreator, upload.single('audioFile'), songController.uploadSongAudio);
router.post('/:id/video', requireCreator, videoUpload.single('videoFile'), songController.uploadSongVideo);
router.post('/:id/cover', requireCreator, coverUpload.single('coverImage'), songController.uploadCoverImage);
router.get('/:id/readiness', requireCreator, songController.getPublishReadiness);
router.put('/:id/publish', requireCreator, songController.publishSong);
router.put('/:id/unpublish', requireCreator, songController.unpublishSong);
router.put('/:id/archive', requireCreator, songController.archiveSong);
router.put('/:id/unarchive', requireCreator, songController.unarchiveSong);
router.delete('/:id', requireCreator, songController.deleteSong);
router.get('/demo-song', (req, res) => res.json({
    song: {
        id: 'demo-song',
        theme: 'Heritage',
        title: 'Demo Rhythm Track',
        thumbnail_url: '',
        video_url: '/videos/exploding-kittens-placeholder.mp4',
    },
}));
router.get('/', songController.listPublicSongs);
router.get('/:id', songController.getPublicSong);

module.exports = router;
