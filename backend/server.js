require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ message: 'Shades of SG backend is running.' });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'shades-of-sg-api',
    });
});

app.use(errorHandler);

async function startServer() {
    app.listen(PORT, () => {
        console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
}

if (require.main === module) {
    startServer();
}

module.exports = app;
