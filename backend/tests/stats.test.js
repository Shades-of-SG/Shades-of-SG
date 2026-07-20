const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const testDatabasePath = path.join(__dirname, 'stats.test.sqlite');
process.env.DB_STORAGE = testDatabasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, Reflection, Song, User } = require('../models');
const { hashPassword } = require('../services/authService');

let creator;
let registeredUser;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({
        email: 'stats-creator@example.com',
        name: 'Stats Creator',
        passwordHash: hashPassword('password123'),
        role: 'CREATOR',
    });
    registeredUser = await User.create({
        email: 'stats-user@example.com',
        name: 'Stats Explorer',
        passwordHash: hashPassword('password123'),
        role: 'REGISTERED',
    });
});

beforeEach(async () => {
    await Reflection.destroy({ where: {} });
    await Song.destroy({ where: {} });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(testDatabasePath)) fs.unlinkSync(testDatabasePath);
});

test('GET /api/stats returns current public database counts', async () => {
    const publishedSong = await Song.create({ creatorId: creator.id, status: 'PUBLISHED', title: 'Public Song' });
    const draftSong = await Song.create({ creatorId: creator.id, status: 'DRAFT', title: 'Draft Song' });
    await Song.create({ creatorId: null, status: 'PUBLISHED', title: 'Legacy Private Song' });

    await Reflection.create({ content: 'A public memory.', songId: publishedSong.id, status: 'APPROVED', userId: registeredUser.id });
    await Reflection.create({ content: 'Still pending.', songId: publishedSong.id, status: 'PENDING', userId: registeredUser.id });
    await Reflection.create({ content: 'Hidden with its song.', songId: draftSong.id, status: 'APPROVED', userId: registeredUser.id });

    const response = await request(app).get('/api/stats');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body).toEqual({ usersCount: 1, songsCount: 1, reflectionsCount: 1 });
});
