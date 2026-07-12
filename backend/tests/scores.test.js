const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'scores.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, GameScore, RhythmBeatmap, Song, User } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

let publishedSong;
let draftSong;
let player;
let otherPlayer;
let creator;

const validPayload = () => ({
    accuracy: 90, difficulty: 'medium', maxCombo: 8, rank: 'S',
    score: 8000, songId: publishedSong.id, totalNotes: 10,
});
const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ email: 'score-creator@example.com', name: 'Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    player = await User.create({ email: 'player@example.com', name: 'Player', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    otherPlayer = await User.create({ email: 'other-player@example.com', name: 'Other', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    publishedSong = await Song.create({ creatorId: creator.id, status: 'PUBLISHED', title: 'Playable Song' });
    draftSong = await Song.create({ creatorId: creator.id, status: 'DRAFT', title: 'Private Song' });
    await RhythmBeatmap.create({
        songId: publishedSong.id, difficulty: 'MEDIUM', durationMs: 30000,
        generationSource: 'MANUAL', status: 'PUBLISHED', version: 1,
        notes: Array.from({ length: 10 }, (_, index) => ({ id: `note-${index}`, lane: index % 4, startMs: 1000 + (index * 500), type: 'tap' })),
    });
});

beforeEach(async () => GameScore.destroy({ where: {} }));
afterAll(async () => { await sequelize.close(); if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath); });

test('guest gameplay creates no database score row', async () => {
    const response = await request(app).post('/api/scores').send(validPayload());
    expect(response.status).toBe(204);
    expect(await GameScore.count()).toBe(0);
});

test('authenticated registered score is saved for the JWT user and ignores supplied userId and rank', async () => {
    const response = await request(app).post('/api/scores').set(authorization(player)).send({
        ...validPayload(), userId: otherPlayer.id, rank: 'S',
    });
    expect(response.status).toBe(201);
    expect(response.body.score).toMatchObject({
        userId: player.id, songId: publishedSong.id, difficulty: 'MEDIUM', rank: 'A',
    });
    expect((await GameScore.findOne()).userId).toBe(player.id);
});

test('creator token is not treated as a registered rhythm player', async () => {
    const response = await request(app).post('/api/scores').set(authorization(creator)).send(validPayload());
    expect(response.status).toBe(403);
    expect(await GameScore.count()).toBe(0);
});

test('draft song score submission is rejected', async () => {
    const response = await request(app).post('/api/scores').set(authorization(player)).send({ ...validPayload(), songId: draftSong.id });
    expect(response.status).toBe(404);
    expect(await GameScore.count()).toBe(0);
});

test.each([
    [{ score: -1 }, 'score must be a non-negative integer'],
    [{ accuracy: 101 }, 'accuracy must be between 0 and 100'],
    [{ difficulty: 'impossible' }, 'difficulty must be EASY, MEDIUM, or HARD'],
    [{ totalNotes: 0 }, 'totalNotes must be an integer between 1 and 10000'],
    [{ maxCombo: 11 }, 'maxCombo must be between 0 and totalNotes'],
    [{ score: 999999 }, 'score exceeds the maximum possible value for this chart'],
])('invalid score values are rejected: %o', async (override, message) => {
    const response = await request(app).post('/api/scores').set(authorization(player)).send({ ...validPayload(), ...override });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(message);
    expect(await GameScore.count()).toBe(0);
});
