const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'song-pagination.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { GameScore, RhythmBeatmap, Song, User, sequelize } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

let creator;
let creatorToken;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ email: 'page-creator@example.com', name: 'Page Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    creatorToken = createToken(creator);
    const songs = await Promise.all(Array.from({ length: 15 }, (_, index) => Song.create({
        artist: index % 2 ? 'Odd Artist' : 'Even Artist',
        creatorId: creator.id,
        languages: [index % 2 ? 'Malay' : 'English'],
        moodTags: [index % 2 ? 'Joyful' : 'Reflective'],
        publishedDate: new Date(Date.UTC(2026, 0, index + 1)),
        status: index === 14 ? 'DRAFT' : 'PUBLISHED',
        theme: index % 2 ? 'Community' : 'Heritage',
        title: `Paged Song ${String(index + 1).padStart(2, '0')}`,
    })));
    await songs[0].update({ audioUrl: 'https://example.com/rhythm.mp3', durationSecs: 30 });
    await RhythmBeatmap.create({
        difficulty: 'EASY', durationMs: 30000, generationSource: 'MANUAL', notes: [{ lane: 1, timeMs: 1000 }],
        publishedAt: new Date(), songId: songs[0].id, status: 'PUBLISHED', version: 1,
    });
    await GameScore.create({ accuracy: 90, difficulty: 'EASY', score: 1000, songId: songs[0].id, userId: creator.id });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('public songs use defaults, custom pages, maximum clamping, and final-page metadata', async () => {
    const first = await request(app).get('/api/songs');
    expect(first.status).toBe(200);
    expect(first.body.items).toHaveLength(12);
    expect(first.body.facets).toEqual({ languages: ['English', 'Malay'], moods: ['Joyful', 'Reflective'], themes: ['Community', 'Heritage'] });
    expect(first.body.pagination).toEqual({ page: 1, limit: 12, totalItems: 14, totalPages: 2, hasNextPage: true, hasPreviousPage: false });

    const final = await request(app).get('/api/songs?page=2&limit=5');
    expect(final.body.items).toHaveLength(5);
    expect(final.body.pagination).toMatchObject({ page: 2, limit: 5, totalItems: 14, totalPages: 3, hasNextPage: true, hasPreviousPage: true });

    const clamped = await request(app).get('/api/songs?page=-8&limit=9999');
    expect(clamped.body.pagination).toMatchObject({ page: 1, limit: 50 });
});

test('search, sort, and JSON filters are applied before pagination totals', async () => {
    const response = await request(app).get('/api/songs?search=Paged&theme=Heritage&language=English&mood=Reflective&sort=title&direction=asc&page=1&limit=3');
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(3);
    expect(response.body.pagination.totalItems).toBe(7);
    expect(response.body.items.map((song) => song.title)).toEqual([...response.body.items.map((song) => song.title)].sort());
});

test('rhythm and played-status filters return eligible songs with beatmap summaries', async () => {
    const rhythm = await request(app).get('/api/songs?rhythm=true&page=1&limit=10');
    expect(rhythm.status).toBe(200);
    expect(rhythm.body.pagination.totalItems).toBe(1);
    expect(rhythm.body.items[0].rhythmDifficulties).toEqual([
        expect.objectContaining({ difficulty: 'EASY', noteCount: 1, status: 'PUBLISHED' }),
    ]);

    const played = await request(app)
        .get('/api/songs?rhythm=true&playStatus=played&page=1&limit=10')
        .set('Authorization', `Bearer ${creatorToken}`);
    expect(played.status).toBe(200);
    expect(played.body.items.map((song) => song.id)).toEqual([rhythm.body.items[0].id]);
});

test('creator pagination isolates ownership and retains unpublished status counts', async () => {
    const response = await request(app).get('/api/songs/creator?page=1&limit=4&status=DRAFT').set('Authorization', `Bearer ${creatorToken}`);
    expect(response.status).toBe(200);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].status).toBe('DRAFT');
    expect(response.body.counts).toMatchObject({ DRAFT: 1, PUBLISHED: 14, total: 15 });
    expect(response.body.pagination).toMatchObject({ page: 1, limit: 4, totalItems: 1, totalPages: 1 });
});
