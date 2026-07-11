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

router.get('/creator', requireCreator, songController.listCreatorSongs);
router.get('/creator/:id', requireCreator, songController.getCreatorSong);
router.post('/extract-audio', requireCreator, songController.extractAudio);
router.post('/', requireCreator, upload.single('audioFile'), songController.createSong);
router.put('/:id/metadata', requireCreator, songController.updateSong);
router.put('/:id/publish', requireCreator, songController.publishSong);
router.put('/:id/unpublish', requireCreator, songController.unpublishSong);
router.get('/', songController.listPublicSongs);
router.get('/:id', songController.getPublicSong);

module.exports = router;
