const express = require('express');
const multer = require('multer');
const songController = require('../controllers/songController');
const { requireCreator } = require('../middleware/auth');

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter(req, file, callback) {
        if (['audio/mpeg', 'audio/wav', 'audio/x-wav'].includes(file.mimetype)) return callback(null, true);
        const error = new Error('Invalid file type. Only MP3 and WAV files are allowed.');
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

router.get('/creator', requireCreator, songController.listCreatorSongs);
router.get('/creator/dashboard/summary', requireCreator, songController.getCreatorDashboardSummary);
router.get('/creator/:id', requireCreator, songController.getCreatorSong);
router.post('/extract-audio', requireCreator, songController.extractAudio);
router.post('/', requireCreator, upload.single('audioFile'), songController.createSong);
router.put('/:id/metadata', requireCreator, songController.updateSong);
router.post('/:id/audio', requireCreator, upload.single('audioFile'), songController.uploadSongAudio);
router.post('/:id/cover', requireCreator, coverUpload.single('coverImage'), songController.uploadCoverImage);
router.get('/:id/readiness', requireCreator, songController.getPublishReadiness);
router.put('/:id/publish', requireCreator, songController.publishSong);
router.put('/:id/unpublish', requireCreator, songController.unpublishSong);
router.put('/:id/archive', requireCreator, songController.archiveSong);
router.delete('/:id', requireCreator, songController.deleteSong);
router.get('/', songController.listPublicSongs);
router.get('/:id', songController.getPublicSong);

module.exports = router;
