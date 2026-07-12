const express = require('express');
const { Song } = require('../models');

const router = express.Router();
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

//lai
// GET all songs
router.get("/", async (req, res, next) => {
    try {
        const songs = await Song.findAll({
            attributes: ["id", "title", "artist", "theme", "language", "moodTags", "description", "audioUrl", "videoUrl"],
        });
        res.json(songs); // ✅ must be an array
    } catch (err) {
        console.error("Error fetching songs:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

//lia end

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


module.exports = router;
