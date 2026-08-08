const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'creator-access-separation.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, GenerationJob, Reflection, Song, User, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const passwordHash = hashPassword('password123');
let admin;
let adminHiddenSong;
let creator;
let creatorReflection;
let publishedSong;
let registered;
let registeredReflection;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    admin = await User.create({ email: 'access-admin@example.com', name: 'Access Admin', passwordHash, role: 'ADMIN' });
    registered = await User.create({ email: 'access-user@example.com', name: 'Regular Listener', passwordHash, role: 'REGISTERED' });
    creator = await User.create({ email: 'access-creator@example.com', name: 'Creator Listener', passwordHash, role: 'CREATOR' });
    publishedSong = await Song.create({
        artist: 'Creator Listener', creatorId: creator.id, languages: ['English'], publishedDate: new Date(),
        status: 'PUBLISHED', title: 'A Song That Stays Published',
    });
    adminHiddenSong = await Song.create({
        artist: 'Creator Listener', creatorId: creator.id, languages: ['English'], publishedDate: new Date(),
        status: 'PUBLISHED', title: 'A Song An Admin Explicitly Unpublishes',
    });
    creatorReflection = await Reflection.create({
        content: 'A creator can also participate as a regular listener.', songId: publishedSong.id,
        status: 'APPROVED', userId: creator.id,
    });
    registeredReflection = await Reflection.create({
        content: 'A regular listener reflection cannot be moderated by a suspended creator.',
        songId: publishedSong.id, status: 'PENDING', userId: registered.id,
    });
    await GenerationJob.create({ songId: publishedSong.id, status: 'COMPLETED' });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('active registered users have normal access but not creator access', async () => {
    expect((await request(app).get('/api/auth/me').set(authorization(registered))).status).toBe(200);
    expect((await request(app).get(`/api/badges/${registered.id}`).set(authorization(registered))).status).toBe(200);
    expect((await request(app).get('/api/songs/creator').set(authorization(registered))).status).toBe(403);
});

test('active creators have both normal-user and creator access', async () => {
    const me = await request(app).get('/api/auth/me').set(authorization(creator));
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({
        accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', creatorStatus: 'ACTIVE', role: 'CREATOR', userStatus: 'ACTIVE',
    });
    expect((await request(app).get(`/api/badges/${creator.id}`).set(authorization(creator))).status).toBe(200);
    expect((await request(app).get('/api/scores/mine').set(authorization(creator))).status).toBe(200);
    expect((await request(app).get('/api/songs/creator').set(authorization(creator))).status).toBe(200);
});

test('creator access endpoints cannot be used to change an administrator account', async () => {
    const response = await request(app).patch(`/api/admin/creators/${admin.id}/status`)
        .set(authorization(admin)).send({ creatorAccessStatus: 'SUSPENDED', reason: 'Invalid self-access attempt.' });
    expect(response.status).toBe(404);
    expect(await admin.reload()).toMatchObject({ accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', role: 'ADMIN' });
});

test('creator suspension blocks every creator route family but preserves normal access and all data', async () => {
    const before = {
        generations: await GenerationJob.count({ where: { songId: publishedSong.id } }),
        reflections: await Reflection.count({ where: { userId: creator.id } }),
        songs: await Song.count({ where: { creatorId: creator.id } }),
        users: await User.count({ where: { id: creator.id } }),
    };
    const suspensionReason = 'Creator programme review is pending. Email creator-support@example.com to appeal.';
    const suspended = await request(app).patch(`/api/admin/creators/${creator.id}/status`)
        .set(authorization(admin)).send({ creatorAccessStatus: 'SUSPENDED', reason: suspensionReason });
    expect(suspended.status).toBe(200);
    expect(suspended.body.creator).toMatchObject({ accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED', creatorSuspensionReason: suspensionReason });
    expect(suspended.body.creator).not.toHaveProperty('passwordHash');

    const current = await creator.reload();
    expect(current).toMatchObject({ accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED' });

    const me = await request(app).get('/api/auth/me').set(authorization(creator));
    expect(me.status).toBe(200);
    expect(me.body.user).toMatchObject({ creatorAccessStatus: 'SUSPENDED', creatorSuspensionReason: suspensionReason });
    expect((await request(app).get(`/api/badges/${creator.id}`).set(authorization(creator))).status).toBe(200);
    expect((await request(app).get('/api/scores/mine').set(authorization(creator))).status).toBe(200);

    const creatorRequests = [
        request(app).get('/api/songs/creator').set(authorization(creator)),
        request(app).get('/api/songs/creator/dashboard/summary').set(authorization(creator)),
        request(app).put(`/api/songs/${publishedSong.id}/unpublish`).set(authorization(creator)),
        request(app).get('/api/generation').set(authorization(creator)),
        request(app).post('/api/generation/start').set(authorization(creator)).send({ songId: publishedSong.id }),
        request(app).post('/api/transcriptions/lyrics').set(authorization(creator)).send({ songId: publishedSong.id }),
        request(app).get('/api/reflections/moderation').set(authorization(creator)),
        request(app).get('/api/folders/proposals/mine').set(authorization(creator)),
        request(app).post('/api/folders/proposals').set(authorization(creator)).send({ name: 'Blocked proposal' }),
        request(app).post('/api/folders/placements').set(authorization(creator)).send({ songId: publishedSong.id }),
        request(app).get('/api/analytics/creator').set(authorization(creator)),
        request(app).get(`/api/songs/${publishedSong.id}/beatmaps/EASY/preview`).set(authorization(creator)),
    ];
    const responses = await Promise.all(creatorRequests);
    responses.forEach((response) => {
        expect(response.status).toBe(403);
        expect(response.body.code).toBe('CREATOR_ACCESS_SUSPENDED');
        expect(response.body.message).toContain('You can continue using Shades of SG as a regular user');
    });

    const moderationAttempt = await request(app).delete(`/api/reflections/${registeredReflection.id}`).set(authorization(creator));
    expect(moderationAttempt.status).toBe(403);
    expect(await Reflection.findByPk(registeredReflection.id)).not.toBeNull();

    expect((await request(app).get(`/api/songs/${publishedSong.id}`)).status).toBe(200);
    expect((await publishedSong.reload()).status).toBe('PUBLISHED');
    expect(await Reflection.findByPk(creatorReflection.id)).not.toBeNull();
    expect({
        generations: await GenerationJob.count({ where: { songId: publishedSong.id } }),
        reflections: await Reflection.count({ where: { userId: creator.id } }),
        songs: await Song.count({ where: { creatorId: creator.id } }),
        users: await User.count({ where: { id: creator.id } }),
    }).toEqual(before);
});

test('restoring creator access immediately restores creator APIs without changing published songs', async () => {
    const restored = await request(app).patch(`/api/admin/creators/${creator.id}/status`)
        .set(authorization(admin)).send({ creatorAccessStatus: 'ACTIVE', reason: 'Creator programme review is complete.' });
    expect(restored.status).toBe(200);
    expect(restored.body.creator).toMatchObject({ accountStatus: 'ACTIVE', creatorAccessStatus: 'ACTIVE', creatorSuspensionReason: null });
    expect((await request(app).get('/api/songs/creator').set(authorization(creator))).status).toBe(200);
    expect((await publishedSong.reload()).status).toBe('PUBLISHED');
});

test('full account suspension blocks normal and creator access with reason, then restores independently', async () => {
    const reason = 'Repeated account safety violations. Contact safety@example.com to appeal.';
    const suspended = await request(app).patch(`/api/admin/users/${creator.id}/status`)
        .set(authorization(admin)).send({ accountStatus: 'SUSPENDED', reason });
    expect(suspended.status).toBe(200);
    expect(suspended.body.user).toMatchObject({ accountStatus: 'SUSPENDED', creatorAccessStatus: 'ACTIVE', accountSuspensionReason: reason });

    for (const response of [
        await request(app).get('/api/auth/me').set(authorization(creator)),
        await request(app).get(`/api/badges/${creator.id}`).set(authorization(creator)),
        await request(app).get('/api/songs/creator').set(authorization(creator)),
        await request(app).get('/api/reflections').set(authorization(creator)),
        await request(app).post('/api/analytics/events').set(authorization(creator)).send({ eventType: 'SONG_PAGE_VIEWED', songId: publishedSong.id }),
    ]) {
        expect(response.status).toBe(403);
        expect(response.body.code).toBe('ACCOUNT_SUSPENDED');
        expect(response.body.message).toContain(reason);
        expect(response.body.message).toMatch(/support|appeal/i);
    }

    const login = await request(app).post('/api/auth/login').send({ email: creator.email, password: 'password123' });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('ACCOUNT_SUSPENDED');
    expect(login.body.message).toContain(reason);

    const restored = await request(app).patch(`/api/admin/users/${creator.id}/status`)
        .set(authorization(admin)).send({ accountStatus: 'ACTIVE', reason: 'Safety review confirms access can be restored.' });
    expect(restored.status).toBe(200);
    expect(restored.body.user).toMatchObject({ accountStatus: 'ACTIVE', accountSuspensionReason: null, creatorAccessStatus: 'ACTIVE' });
    expect((await request(app).get('/api/auth/me').set(authorization(creator))).status).toBe(200);
    expect((await request(app).get('/api/songs/creator').set(authorization(creator))).status).toBe(200);

    const auditActions = (await AuditLog.findAll({ where: { entityId: creator.id }, order: [['createdAt', 'ASC']] })).map((entry) => entry.action);
    expect(auditActions).toEqual(expect.arrayContaining([
        'CREATOR_SUSPENDED', 'CREATOR_RESTORED', 'ACCOUNT_SUSPENDED', 'ACCOUNT_RESTORED',
    ]));
    expect((await publishedSong.reload()).status).toBe('PUBLISHED');
});

test('admins can explicitly unpublish an individual song without deleting it or changing creator access', async () => {
    const reason = 'Individual content review requires this song to leave the public library.';
    const response = await request(app).post(`/api/admin/songs/${adminHiddenSong.id}/unpublish`)
        .set(authorization(admin)).send({ reason });

    expect(response.status).toBe(200);
    expect(response.body.song).toMatchObject({
        creatorId: creator.id, id: adminHiddenSong.id, status: 'READY', title: adminHiddenSong.title,
    });
    expect(await Song.findByPk(adminHiddenSong.id)).not.toBeNull();
    expect((await creator.reload()).creatorAccessStatus).toBe('ACTIVE');
    expect((await publishedSong.reload()).status).toBe('PUBLISHED');

    const audit = await AuditLog.findOne({
        where: { action: 'SONG_UNPUBLISHED_BY_ADMIN', entityId: adminHiddenSong.id },
    });
    expect(audit).not.toBeNull();
    expect(audit.metadata).toMatchObject({ reason });
});
