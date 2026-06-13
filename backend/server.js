require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ message: 'Shades of SG backend is running.' });
});

app.get('/api/health', async (req, res, next) => {
    try {
        await sequelize.authenticate();
        res.json({
            status: 'ok',
            service: 'shades-of-sg-api',
            database: 'connected',
        });
    } catch (error) {
        next(error);
    }
});

app.use(errorHandler);

async function startServer() {
    try {
        await sequelize.authenticate();
        app.listen(PORT, () => {
            console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = app;
