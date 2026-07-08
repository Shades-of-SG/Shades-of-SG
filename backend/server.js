require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const sequelize = require('./config/database');
//const authRouter = require('./routes/auth');
const scoresRouter = require('./routes/scores');
const songsRouter = require('./routes/songs');
const transcriptionsRouter = require('./routes/transcriptions');
const { seedCreatorAccount } = require('./services/authService');


const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies
const PORT = process.env.PORT || 5000;

//Lia added the folowing for authentication
const authRoutes = require("./routes/authRoutes");

app.use("/auth", authRoutes); //gg bruh this was commented then i dah uncomment baru boleh work sia..
app.use("/api/auth", authRoutes); // ✅ mount under /api/auth
//End of Lia auth added code

app.use(cors());
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
app.use('/api/scores', scoresRouter);
app.use('/api/auth', authRoutes);

app.use(errorHandler);

async function startServer() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        await seedCreatorAccount();

        console.log('Database connected successfully');

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
