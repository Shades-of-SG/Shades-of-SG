const path = require('path');
const fs = require('fs');

process.env.DATABASE_URL = '';
const testDatabasePath = path.join(__dirname, 'reflections.test.sqlite');
process.env.DB_STORAGE = testDatabasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, Reflection, Song, User } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let creator;
let creatorToken;
let owner;
let ownerToken;
let song;
let secondSong;

function singaporeDayStart(daysFromToday = 0) {
    const now = new Date();
    const singaporeNow = new Date(now.getTime() + SINGAPORE_OFFSET_MS);
    return new Date(
        Date.UTC(
            singaporeNow.getUTCFullYear(),
            singaporeNow.getUTCMonth(),
            singaporeNow.getUTCDate()
        ) - SINGAPORE_OFFSET_MS + (daysFromToday * ONE_DAY_MS)
    );
}

async function createStoredReflection(overrides = {}) {
    return Reflection.create({
        content: 'A stored memory.',
        displayMode: 'ANONYMOUS',
        displayName: null,
        guestSubmission: true,
        songId: song.id,
        status: 'PENDING',
        tags: [],
        userId: null,
        ...overrides,
    });
}

beforeAll(async () => {
    await sequelize.sync({ force: true });
    owner = await User.create({
        email: 'reflection-owner@example.com',
        name: 'Memory Keeper',
        passwordHash: hashPassword('password123'),
    });
    creator = await User.create({
        email: 'violet@example.com',
        name: 'Violet',
        passwordHash: hashPassword('password123'),
        role: 'CREATOR',
    });
    song = await Song.create({ creatorId: creator.id, title: 'Test Song', status: 'PUBLISHED' });
    secondSong = await Song.create({ creatorId: creator.id, title: 'Second Song', status: 'PUBLISHED' });
    ownerToken = createToken(owner);
    creatorToken = createToken(creator);
});

beforeEach(async () => {
    await Reflection.destroy({ where: {} });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(testDatabasePath)) fs.unlinkSync(testDatabasePath);
});

test('reflection owner can create, read, update, and delete a reflection', async () => {
    const created = await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            content: 'A memory of home.',
            isAnonymous: false,
            songId: song.id,
            tags: [' family ', 'FAMILY', 'Home', 'unknown'],
        });

    expect(created.status).toBe(201);
    expect(created.body.reflection).toMatchObject({
        content: 'A memory of home.',
        displayName: 'Memory Keeper',
        guestSubmission: false,
        isOwner: true,
        song: { title: 'Test Song' },
        tags: ['Family', 'Home'],
    });

    const id = created.body.reflection.id;
    const listed = await request(app).get('/api/reflections');
    expect(listed.status).toBe(200);
    expect(listed.body.reflections).toHaveLength(1);
    expect(listed.body.reflections[0]).not.toHaveProperty('guestSubmission');

    const updated = await request(app)
        .put(`/api/reflections/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'An updated memory.', isAnonymous: true, songId: song.id });
    expect(updated.status).toBe(200);
    expect(updated.body.reflection).toMatchObject({
        content: 'An updated memory.',
        isAnonymous: true,
        tags: ['Family', 'Home'],
    });

    const deleted = await request(app)
        .delete(`/api/reflections/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(deleted.status).toBe(204);
});

test('a guest can submit an anonymous reflection for moderation', async () => {
    const response = await request(app)
        .post('/api/reflections')
        .send({ content: 'A memory.', songId: song.id, memoryTypes: ['nostalgia'] });

    expect(response.status).toBe(201);
    expect(response.body.reflection).toMatchObject({
        displayName: 'Anonymous',
        displayMode: 'ANONYMOUS',
        guestSubmission: true,
        isAnonymous: true,
        isOwner: false,
        status: 'PENDING',
        tags: ['Nostalgia'],
    });

    const listed = await request(app).get('/api/reflections');
    expect(listed.body.reflections).toHaveLength(0);
});

test('moderation endpoints require a current creator account', async () => {
    const reflection = await createStoredReflection();

    const unauthenticated = await request(app).get('/api/reflections/moderation');
    expect(unauthenticated.status).toBe(401);

    const registered = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(registered.status).toBe(403);

    const registeredUpdate = await request(app)
        .put(`/api/reflections/${reflection.id}/moderation`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'APPROVED' });
    expect(registeredUpdate.status).toBe(403);
    await reflection.reload();
    expect(reflection.status).toBe('PENDING');
});

test('creator moderation list combines filters, paginates, searches all supported fields, and returns global counts', async () => {
    const startToday = singaporeDayStart();
    const todayFirst = new Date(startToday.getTime() + (60 * 60 * 1000));
    const todaySecond = new Date(startToday.getTime() + (2 * 60 * 60 * 1000));
    const yesterday = new Date(startToday.getTime() - ONE_DAY_MS + (60 * 60 * 1000));
    const twoDaysAgo = new Date(startToday.getTime() - (2 * ONE_DAY_MS) + (60 * 60 * 1000));

    const anonymousFamily = await createStoredReflection({
        content: 'Rain at the parade.',
        createdAt: todaySecond,
        tags: ['Family'],
    });
    const profileReflection = await createStoredReflection({
        content: 'A classroom memory.',
        createdAt: todayFirst,
        displayMode: 'PROFILE',
        displayName: 'Memory Keeper',
        guestSubmission: false,
        songId: secondSong.id,
        tags: ['School'],
        userId: owner.id,
    });
    await createStoredReflection({ createdAt: yesterday, status: 'APPROVED' });
    await createStoredReflection({ createdAt: twoDaysAgo, status: 'FLAGGED' });

    const paged = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${creatorToken}`)
        .query({ status: 'PENDING', page: 2, limit: 1 });

    expect(paged.status).toBe(200);
    expect(paged.body.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(paged.body.reflections).toHaveLength(1);
    expect(paged.body.stats).toEqual({
        pending: 2,
        approved: 1,
        flagged: 1,
        newToday: 2,
        newYesterday: 1,
    });

    const combined = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${creatorToken}`)
        .query({
            status: 'PENDING',
            search: 'family',
            songId: song.id,
            dateFrom: startToday.toISOString(),
            anonymousOnly: 'true',
        });

    expect(combined.status).toBe(200);
    expect(combined.body.reflections.map((item) => item.id)).toEqual([anonymousFamily.id]);
    expect(combined.body.reflections[0]).toMatchObject({
        guestSubmission: true,
        submissionType: 'GUEST',
        tags: ['Family'],
    });

    const [contentSearch, authorSearch, songSearch] = await Promise.all([
        request(app)
            .get('/api/reflections/moderation')
            .set('Authorization', `Bearer ${creatorToken}`)
            .query({ status: 'PENDING', search: 'parade' }),
        request(app)
            .get('/api/reflections/moderation')
            .set('Authorization', `Bearer ${creatorToken}`)
            .query({ status: 'PENDING', search: 'Memory Keeper' }),
        request(app)
            .get('/api/reflections/moderation')
            .set('Authorization', `Bearer ${creatorToken}`)
            .query({ status: 'PENDING', search: 'Second Song' }),
    ]);

    expect(contentSearch.body.reflections.map((item) => item.id)).toEqual([anonymousFamily.id]);
    expect(authorSearch.body.reflections.map((item) => item.id)).toEqual([profileReflection.id]);
    expect(songSearch.body.reflections.map((item) => item.id)).toEqual([profileReflection.id]);

    const capped = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${creatorToken}`)
        .query({ limit: 100 });
    expect(capped.body.pagination.limit).toBe(24);
});

test('creator can approve a guest reflection, save a moderator note, and make it publicly visible', async () => {
    const submitted = await request(app)
        .post('/api/reflections')
        .send({ content: 'A pending memory.', songId: song.id });
    const id = submitted.body.reflection.id;

    const approved = await request(app)
        .put(`/api/reflections/${id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'APPROVED', moderatorNote: 'Suitable for the wall.' });

    expect(approved.status).toBe(200);
    expect(approved.body.reflection).toMatchObject({
        id,
        status: 'APPROVED',
        moderatorNote: 'Suitable for the wall.',
        moderatedBy: creator.id,
        moderator: { id: creator.id, name: 'Violet' },
    });
    expect(approved.body.reflection.moderatedAt).toBeTruthy();

    const publiclyListed = await request(app).get('/api/reflections');
    expect(publiclyListed.body.reflections).toHaveLength(1);
    expect(publiclyListed.body.reflections[0].id).toBe(id);
    expect(publiclyListed.body.reflections[0]).not.toHaveProperty('guestSubmission');

    const tooLong = await request(app)
        .put(`/api/reflections/${id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'FLAGGED', moderatorNote: 'x'.repeat(1001) });
    expect(tooLong.status).toBe(400);

    const unchanged = await Reflection.findByPk(id);
    expect(unchanged.status).toBe('APPROVED');
    expect(unchanged.moderatorNote).toBe('Suitable for the wall.');
});

test('flagging an approved reflection immediately hides it from the public API', async () => {
    const submitted = await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'A visible memory.', songId: song.id });
    const id = submitted.body.reflection.id;

    expect((await request(app).get('/api/reflections')).body.reflections).toHaveLength(1);

    const flagged = await request(app)
        .put(`/api/reflections/${id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'FLAGGED' });
    expect(flagged.status).toBe(200);
    expect(flagged.body.reflection.status).toBe('FLAGGED');

    expect((await request(app).get('/api/reflections')).body.reflections).toHaveLength(0);
});

test('creator can delete any reflection while a regular non-owner cannot', async () => {
    const reflection = await createStoredReflection();

    const forbidden = await request(app)
        .delete(`/api/reflections/${reflection.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(forbidden.status).toBe(403);
    expect(await Reflection.findByPk(reflection.id)).not.toBeNull();

    const deleted = await request(app)
        .delete(`/api/reflections/${reflection.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);
    expect(deleted.status).toBe(204);
    expect(await Reflection.findByPk(reflection.id)).toBeNull();
});

test('public reflection API excludes both pending and flagged submissions', async () => {
    await createStoredReflection({ content: 'Pending' });
    await createStoredReflection({ content: 'Flagged', status: 'FLAGGED' });
    const approved = await createStoredReflection({ content: 'Approved', status: 'APPROVED' });

    const response = await request(app).get('/api/reflections');
    expect(response.status).toBe(200);
    expect(response.body.reflections.map((item) => item.id)).toEqual([approved.id]);
});
