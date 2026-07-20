require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./config/database');
const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');
const songsRouter = require('./routes/songs');
const reflectionsRouter = require('./routes/reflections');
const transcriptionsRouter = require('./routes/transcriptions');
const generationRouter = require('./routes/aiGeneration');
const badgesRouter = require('./routes/badges');
const beatmapsRouter = require('./routes/beatmaps');
const statsRouter = require('./routes/stats');
const { seedCreatorAccount } = require('./services/authService');
const { GenerationJob, Song } = require('./models');
const {
    ensureGameScoreSchema,
    ensureGenerationJobSchema,
    ensureGuestReflectionSchema,
    ensureReflectionModerationSchema,
    ensureRhythmBeatmapSchema,
    ensureSongSchema,
    ensureSongMediaSchema,
} = require('./services/schemaService');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Allow tools such as Postman and server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            const err = new Error('Not allowed by CORS');
            err.status = 403;
            return callback(err);
        },
        credentials: true,
    })
);

app.use(express.json({ limit: '40mb' }));

app.get('/api', (req, res) => {
    res.json({ message: 'Shades of SG backend is running.' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'shades-of-sg-api',
    });
});

app.use('/api/songs', songsRouter);
app.use('/api/songs/:songId/beatmaps', beatmapsRouter);
app.use('/api/scores', scoresRouter);
app.use('/api/reflections', reflectionsRouter);
app.use('/api/auth', authRouter);
app.use('/api/generation', generationRouter);
app.use('/api/transcriptions', transcriptionsRouter);
app.use('/api/badges', badgesRouter);
app.use('/api/stats', statsRouter);

// Global 404 JSON Handler to prevent Express HTML fallbacks
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await ensureGameScoreSchema(sequelize);
        await ensureGuestReflectionSchema(sequelize);
        await ensureReflectionModerationSchema(sequelize);
        await ensureSongSchema(sequelize);
        await ensureGenerationJobSchema(sequelize);
        await ensureRhythmBeatmapSchema(sequelize);
        await ensureSongMediaSchema(sequelize);
        await seedCreatorAccount();
        console.log('Database connected successfully');

        // Rescue stuck jobs from previous interrupted runs
        try {
            const stuckJobs = await GenerationJob.findAll({ 
                where: { status: ['PROCESSING', 'QUEUED'] } 
            });
            let rescued = 0;
            for (const job of stuckJobs) {
                const song = await Song.findByPk(job.songId);
                if (song && song.videoUrl) {
                    await job.update({ status: 'COMPLETED', errorMessage: null });
                } else {
                    await job.update({ status: 'FAILED', errorMessage: 'Server restarted during processing. Please try exporting again.' });
                }
                rescued++;
            }
            if (rescued > 0) console.log(`[Startup] Rescued ${rescued} stuck generation jobs.`);
        } catch (e) {
            console.error('[Startup] Failed to rescue stuck jobs:', e);
        }

        app.listen(PORT, () => {
            console.log(
                `Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
            );
        });
    } catch (error) {
        console.error('Unable to connect to database:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
