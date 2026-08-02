require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./config/database');
//const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');
const songsRouter = require('./routes/songs');
const reflectionsRouter = require('./routes/reflections');
const transcriptionsRouter = require('./routes/transcriptions');
const generationRouter = require('./routes/aiGeneration');
const badgesRouter = require('./routes/badges');
const beatmapsRouter = require('./routes/beatmaps');
const statsRouter = require('./routes/stats');
const creatorApplicationsRouter = require('./routes/creatorApplications');
const foldersRouter = require('./routes/folders');
const analyticsRouter = require('./routes/analytics');
const adminRouter = require('./routes/admin');
const creatorsRouter = require('./routes/creators');
const usersRouter = require('./routes/users');
const { seedAdminAccount } = require('./services/authService');
const { GenerationJob, Song } = require('./models');


const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

function normalizeOrigin(value) {
    try {
        const url = new URL(String(value || '').trim());
        return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
    } catch {
        return null;
    }
}

function allowedOrigins() {
    return new Set([
        'http://localhost:5173',
        process.env.FRONTEND_URL,
        ...String(process.env.FRONTEND_URLS || '').split(','),
    ].map(normalizeOrigin).filter(Boolean));
}

function normalizeOriginPattern(value) {
    const pattern = String(value || '').trim();
    if ((pattern.match(/\*/g) || []).length !== 1) return null;
    const placeholder = 'cors-preview-wildcard';
    try {
        const url = new URL(pattern.replace('*', placeholder));
        if (url.protocol !== 'https:' || url.origin !== pattern.replace('*', placeholder)) return null;
        return url.origin.replace(placeholder, '*');
    } catch {
        return null;
    }
}

function allowedOriginPatterns() {
    return String(process.env.FRONTEND_URL_PATTERNS || '')
        .split(',')
        .map(normalizeOriginPattern)
        .filter(Boolean);
}

function matchesAllowedOriginPattern(origin) {
    return allowedOriginPatterns().some((pattern) => {
        const expression = pattern
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            .replace('\\*', '[^.]+');
        return new RegExp(`^${expression}$`).test(origin);
    });
}

app.use(
    cors({
        origin(origin, callback) {
            // Allow tools such as Postman and server-to-server requests
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins().has(origin) || matchesAllowedOriginPattern(origin)) {
                return callback(null, true);
            }

            const err = new Error('Not allowed by CORS');
            err.status = 403;
            return callback(err);
        },
        credentials: true,
    })
);

//Lia added the folowing for authentication
//const authRoutes = require("./routes/authRoutes");

//app.use("/auth", authRoutes); //gg bruh this was commented then i dah uncomment baru boleh work sia..
//app.use("/api/auth", authRoutes); // ✅ mount under /api/auth
//End of Lia auth added code

//app.use(cors());

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
app.use('/api/creator-applications', creatorApplicationsRouter);
app.use('/api/folders', foldersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/creators', creatorsRouter);
app.use('/api/users', usersRouter);

// Global 404 JSON Handler to prevent Express HTML fallbacks
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

async function startServer() {
    try {
        await sequelize.authenticate();
        await seedAdminAccount();
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

        app.listen(PORT, HOST, () => {
            console.log(
                `Server is running in ${process.env.NODE_ENV || 'development'} mode on ${HOST}:${PORT}`
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
