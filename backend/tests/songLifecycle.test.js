const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const testDatabasePath = path.join(__dirname, 'song-lifecycle.test.sqlite');
process.env.DB_STORAGE = testDatabasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, GenerationJob, Song, User } = require('../models');
const { completeGeneration } = require('../controllers/generationController');
const { createToken, hashPassword } = require('../services/authService');

let creator;
let creatorToken;
let otherCreator;
let otherToken;

const completeSong = {
    artist: 'Test Artist',
    audioUrl: 'https://media.example/audio.mp3',
    coverImageUrl: 'https://media.example/cover.jpg',
    description: 'A complete cultural description.',
    languages: ['English'],
    rawLyrics: 'Complete lyrics',
    theme: 'Heritage',
    title: 'Complete Song',
    videoUrl: 'https://media.example/temporary-placeholder.mp4',
};

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({
        email: 'song-creator@example.com', name: 'Song Creator',
        passwordHash: hashPassword('password123'), role: 'CREATOR',
    });
    otherCreator = await User.create({
        email: 'other-creator@example.com', name: 'Other Creator',
        passwordHash: hashPassword('password123'), role: 'CREATOR',
    });
    creatorToken = createToken(creator);
    otherToken = createToken(otherCreator);
});

beforeEach(async () => {
    await GenerationJob.destroy({ where: {} });
    await Song.destroy({ where: {} });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(testDatabasePath)) fs.unlinkSync(testDatabasePath);
});

function auth(token) { return { Authorization: `Bearer ${token}` }; }

test.each(['DRAFT', 'READY'])('%s songs are not publicly visible', async (status) => {
    const song = await Song.create({ creatorId: creator.id, status, title: `${status} Song` });
    const list = await request(app).get('/api/songs');
    const detail = await request(app).get(`/api/songs/${song.id}`);
    expect(list.status).toBe(200);
    expect(list.body.songs).toHaveLength(0);
    expect(detail.status).toBe(404);
});

test('generation completion marks the job COMPLETED and song READY without publishing', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'GENERATING' });
    const job = await GenerationJob.create({ songId: song.id, status: 'PROCESSING' });
    await completeGeneration(job.id);
    await Promise.all([song.reload(), job.reload()]);
    expect(job.status).toBe('COMPLETED');
    expect(job.completedAt).toBeTruthy();
    expect(song.status).toBe('READY');
    expect(song.publishedDate).toBeNull();
    expect((await request(app).get(`/api/songs/${song.id}`)).status).toBe(404);
});

test('publish fails and reports missing required data', async () => {
    const song = await Song.create({ creatorId: creator.id, status: 'READY', title: 'Incomplete' });
    await GenerationJob.create({ songId: song.id, status: 'COMPLETED' });
    const response = await request(app)
        .put(`/api/songs/${song.id}/publish`).set(auth(creatorToken));
    expect(response.status).toBe(400);
    expect(response.body.missing).toEqual(expect.arrayContaining([
        'artist', 'description', 'theme', 'languages', 'rawLyrics',
        'coverImageUrl', 'audioUrl', 'videoUrl',
    ]));
    await song.reload();
    expect(song.status).toBe('READY');
});

test('publish succeeds only for an owned READY song with complete media and generation', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'READY' });
    await GenerationJob.create({ songId: song.id, status: 'COMPLETED' });
    const response = await request(app)
        .put(`/api/songs/${song.id}/publish`).set(auth(creatorToken));
    expect(response.status).toBe(200);
    expect(response.body.song.status).toBe('PUBLISHED');
    expect(response.body.song.publishedDate).toBeTruthy();
    expect((await request(app).get('/api/songs')).body.songs.map((item) => item.id)).toContain(song.id);
});

test('another creator cannot edit or publish a song they do not own', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'READY' });
    await GenerationJob.create({ songId: song.id, status: 'COMPLETED' });
    const edit = await request(app)
        .put(`/api/songs/${song.id}/metadata`).set(auth(otherToken)).send({ title: 'Stolen' });
    const publish = await request(app)
        .put(`/api/songs/${song.id}/publish`).set(auth(otherToken));
    expect(edit.status).toBe(404);
    expect(publish.status).toBe(404);
    await song.reload();
    expect(song.title).toBe('Complete Song');
    expect(song.status).toBe('READY');
});

test('unpublish returns a song to READY and removes it from public responses', async () => {
    const song = await Song.create({
        ...completeSong, creatorId: creator.id, status: 'PUBLISHED', publishedDate: new Date(),
    });
    expect((await request(app).get(`/api/songs/${song.id}`)).status).toBe(200);
    const response = await request(app)
        .put(`/api/songs/${song.id}/unpublish`).set(auth(creatorToken));
    expect(response.status).toBe(200);
    expect(response.body.song.status).toBe('READY');
    expect(response.body.song.publishedDate).toBeNull();
    expect((await request(app).get(`/api/songs/${song.id}`)).status).toBe(404);
});

test('creator song endpoints return only that creator\'s songs across all lifecycle states', async () => {
    for (const status of ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']) {
        await Song.create({ creatorId: creator.id, status, title: status });
    }
    await Song.create({ creatorId: otherCreator.id, status: 'DRAFT', title: 'Other' });
    const response = await request(app).get('/api/songs/creator').set(auth(creatorToken));
    expect(response.status).toBe(200);
    expect(response.body.songs).toHaveLength(5);
    expect(new Set(response.body.songs.map((song) => song.status))).toEqual(
        new Set(['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'])
    );
    expect(response.body.songs.every((song) => song.creatorId === creator.id)).toBe(true);
});
