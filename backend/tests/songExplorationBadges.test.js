const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'song-exploration-badges.manual.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { Badge, sequelize, Song, User } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
let creator;
let songs;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ email: 'explore-creator@example.com', name: 'Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    songs = await Promise.all([1, 2, 3, 4, 5, 6].map((n) => Song.create({ artist: 'Creator', creatorId: creator.id, status: 'PUBLISHED', title: `Song ${n}` })));
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('awards First Song, Curious Bug, Song Explorer as distinct songs are explored, without double counting repeats', async () => {
    const user = await User.create({ email: 'explorer@example.com', name: 'Explorer', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    const view = (song) => request(app).post('/api/analytics/events').set(authorization(user)).send({ eventType: 'SONG_PAGE_VIEWED', songId: song.id });

    await view(songs[0]);
    await view(songs[0]); // reload same song again — should not count twice
    let names = (await Badge.findAll({ where: { userId: user.id } })).map((b) => b.name);
    expect(names).toEqual(['First Song']);

    await view(songs[1]);
    await view(songs[2]);
    names = (await Badge.findAll({ where: { userId: user.id } })).map((b) => b.name);
    expect(names.sort()).toEqual(['Curious Bug', 'First Song']);

    await view(songs[3]);
    await view(songs[4]);
    names = (await Badge.findAll({ where: { userId: user.id } })).map((b) => b.name);
    expect(names.sort()).toEqual(['Curious Bug', 'First Song', 'Song Explorer']);
});
