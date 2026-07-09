const express = require('express');
const { Song } = require('../models');

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        if (id === 'demo-song') {
            return res.json({
                song: {
                    id,
                    theme: 'Heritage',
                    title: 'Demo Rhythm Track',
                    thumbnail_url: '',
                    video_url: '/videos/exploding-kittens-placeholder.mp4',
                },
            });
        }

        if (!UUID_PATTERN.test(id)) {
            return res.status(404).json({ message: 'Song not found' });
        }

        const song = await Song.findByPk(id, {
            attributes: ['id', 'theme', 'title', 'videoUrl'],
        });

        if (!song) {
            return res.status(404).json({ message: 'Song not found' });
        }

        return res.json({
            song: {
                id: song.id,
                theme: song.theme,
                title: song.title,
                thumbnail_url: '',
                video_url: song.videoUrl,
            },
        });
    } catch (error) {
        return next(error);
    }
});

const multer = require('multer')
const songController = require('../controllers/songController')

// Multer Config
const storage = multer.memoryStorage()
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/wav') {
    cb(null, true)
  } else {
    const error = new Error('Invalid file type. Only MP3 and WAV files are allowed.')
    error.statusCode = 400
    cb(error, false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
})

// Placeholder JWT Auth bypass for testing
const requireAuth = (req, res, next) => next()

// POST Route
router.post('/', requireAuth, upload.single('audioFile'), songController.uploadSong)

module.exports = router;
