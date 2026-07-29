const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'multi-creator-isolation.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, CreatorApplication, Folder, GameScore, GeneratedFrame, GenerationJob,
    ModerationAction, Reflection, RhythmBeatmap, SceneSegment, Song, SongFolder,
    User, UserWarning, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const principals = {};
const tokens = {};
const resources = {};

async function user(name, email, role) {
    const value = await User.create({ email, name, passwordHash: hashPassword('password123'), role });
    principals[role === 'CREATOR' ? name : role] = value;
    tokens[role === 'CREATOR' ? name : role] = createToken(value);
    return value;
}

beforeAll(async () => {
    await sequelize.sync({ force: true });
    const creatorA = await user('Creator A', 'creator-a@example.com', 'CREATOR');
    const creatorB = await user('Creator B', 'creator-b@example.com', 'CREATOR');
    await user('Admin', 'admin@example.com', 'ADMIN');
    const registered = await user('Registered', 'registered@example.com', 'REGISTERED');

    resources.songA = await Song.create({ creatorId: creatorA.id, title: 'Song A', status: 'DRAFT' });
    resources.songB = await Song.create({ creatorId: creatorB.id, title: 'Song B', status: 'PUBLISHED' });
    resources.jobA = await GenerationJob.create({ songId: resources.songA.id, status: 'COMPLETED' });
    resources.jobB = await GenerationJob.create({ songId: resources.songB.id, status: 'COMPLETED' });
    resources.segmentA = await SceneSegment.create({ songId: resources.songA.id, startTime: 0, endTime: 5, visualPrompt: 'A' });
    resources.segmentB = await SceneSegment.create({ songId: resources.songB.id, startTime: 0, endTime: 5, visualPrompt: 'B' });
    resources.frameA = await GeneratedFrame.create({ sceneSegmentId: resources.segmentA.id, imageUrl: 'https://example.com/a.jpg' });
    resources.frameB = await GeneratedFrame.create({ sceneSegmentId: resources.segmentB.id, imageUrl: 'https://example.com/b.jpg' });
    resources.reflectionA = await Reflection.create({ content: 'A memory', displayMode: 'ANONYMOUS', guestSubmission: true, songId: resources.songA.id, status: 'PENDING' });
    resources.reflectionB = await Reflection.create({ content: 'B memory', displayMode: 'ANONYMOUS', guestSubmission: true, songId: resources.songB.id, status: 'PENDING' });
    await RhythmBeatmap.create({ difficulty: 'EASY', durationMs: 5000, generationSource: 'MANUAL', notes: [], songId: resources.songB.id, status: 'PUBLISHED' });
    await GameScore.create({ accuracy: 90, difficulty: 'EASY', score: 1000, songId: resources.songB.id, userId: registered.id });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('guest, registered user, creator, and admin role boundaries are database-backed', async () => {
    expect((await request(app).get('/api/songs/creator')).status).toBe(401);
    expect((await request(app).get('/api/songs/creator').set('Authorization', `Bearer ${tokens.REGISTERED}`)).status).toBe(403);
    expect((await request(app).get('/api/admin/analytics').set('Authorization', `Bearer ${tokens['Creator A']}`)).status).toBe(403);
    expect((await request(app).get('/api/stats')).status).toBe(401);
    expect((await request(app).get('/api/stats').set('Authorization', `Bearer ${tokens.ADMIN}`)).status).toBe(200);
});

test('Creator A cannot read, update, publish, delete, or moderate Creator B content', async () => {
    const auth = { Authorization: `Bearer ${tokens['Creator A']}` };
    expect((await request(app).get(`/api/songs/creator/${resources.songB.id}`).set(auth)).status).toBe(404);
    expect((await request(app).put(`/api/songs/${resources.songB.id}/metadata`).set(auth).send({ title: 'Stolen' })).status).toBe(404);
    expect((await request(app).put(`/api/songs/${resources.songB.id}/publish`).set(auth)).status).toBe(404);
    expect((await request(app).delete(`/api/songs/${resources.songB.id}`).set(auth)).status).toBe(404);
    expect((await request(app).put(`/api/reflections/${resources.reflectionB.id}/moderation`).set(auth).send({ status: 'APPROVED' })).status).toBe(404);
    expect((await request(app).delete(`/api/reflections/${resources.reflectionB.id}`).set(auth)).status).toBe(404);
    expect((await Song.findByPk(resources.songB.id)).title).toBe('Song B');
    expect((await Reflection.findByPk(resources.reflectionB.id)).status).toBe('PENDING');
});

test('nested jobs, scene segments, generated frames, and beatmaps are isolated through song ownership', async () => {
    const auth = { Authorization: `Bearer ${tokens['Creator A']}` };
    expect((await request(app).get(`/api/generation/${resources.jobB.id}/status`).set(auth)).status).toBe(404);
    expect((await request(app).post(`/api/generation/${resources.jobB.id}/export`).set(auth).send({})).status).toBe(404);
    expect((await request(app).delete(`/api/generation/${resources.jobB.id}`).set(auth)).status).toBe(404);
    expect((await request(app).post(`/api/generation/frame/${resources.frameB.id}/regenerate`).set(auth).send({ userFeedback: 'change it' })).status).toBe(404);
    expect((await request(app).get(`/api/songs/${resources.songB.id}/beatmaps/EASY/preview`).set(auth)).status).toBe(404);
    expect((await request(app).put(`/api/songs/${resources.songB.id}/beatmaps/EASY/publish`).set(auth)).status).toBe(404);
    expect((await GeneratedFrame.findByPk(resources.frameB.id)).imageUrl).toBe('https://example.com/b.jpg');
    expect(await GenerationJob.findByPk(resources.jobB.id)).not.toBeNull();

    const disposableSong = await Song.create({ creatorId: principals['Creator A'].id, title: 'Song with disposable job', status: 'DRAFT' });
    const disposableJob = await GenerationJob.create({ songId: disposableSong.id, status: 'FAILED' });
    expect((await request(app).delete(`/api/generation/${disposableJob.id}`).set(auth)).status).toBe(200);
    expect(await Song.findByPk(disposableSong.id)).not.toBeNull();
});

test('creator moderation list and every statistic exclude another creator songs', async () => {
    const response = await request(app).get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${tokens['Creator A']}`).query({ status: 'PENDING' });
    expect(response.status).toBe(200);
    expect(response.body.reflections.map((item) => item.id)).toEqual([resources.reflectionA.id]);
    expect(response.body.stats.pending).toBe(1);
    expect(response.body.stats.approved).toBe(0);

    const otherSongFilter = await request(app).get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${tokens['Creator A']}`).query({ songId: resources.songB.id, status: 'PENDING' });
    expect(otherSongFilter.status).toBe(404);
});

test('owning creator can moderate and immutable histories record the derived song and actor', async () => {
    const response = await request(app).put(`/api/reflections/${resources.reflectionA.id}/moderation`)
        .set('Authorization', `Bearer ${tokens['Creator A']}`).send({ moderatorNote: 'Reviewed', status: 'APPROVED' });
    expect(response.status).toBe(200);
    expect(await ModerationAction.count({ where: { actorId: principals['Creator A'].id, songId: resources.songA.id, targetId: resources.reflectionA.id } })).toBe(1);
    expect(await AuditLog.count({ where: { action: 'REFLECTION_MODERATED', actorId: principals['Creator A'].id, songId: resources.songA.id } })).toBe(1);
});

test('creator analytics are unaffected by activity attached to Creator B songs', async () => {
    const response = await request(app).get('/api/analytics/creator').set('Authorization', `Bearer ${tokens['Creator A']}`);
    expect(response.status).toBe(200);
    expect(response.body.rhythmScores).toBe(0);
    expect(response.body.songs.total).toBe(2);
    expect(response.body.reflections.APPROVED).toBe(1);
});

test('registered applicant cannot forge user identity and admin approval converts exactly that applicant', async () => {
    const submitted = await request(app).post('/api/creator-applications')
        .set('Authorization', `Bearer ${tokens.REGISTERED}`)
        .send({ portfolioUrl: 'https://portfolio.example.com', statement: 'I create Singapore National Day songs and want to contribute original educational music for the community.', userId: principals['Creator B'].id, status: 'APPROVED' });
    expect(submitted.status).toBe(201);
    const application = await CreatorApplication.findByPk(submitted.body.application.id);
    expect(application.userId).toBe(principals.REGISTERED.id);
    expect(application.status).toBe('SUBMITTED');

    expect((await request(app).get('/api/admin/creator-applications').set('Authorization', `Bearer ${tokens['Creator A']}`)).status).toBe(403);
    const approved = await request(app).patch(`/api/admin/creator-applications/${application.id}/status`)
        .set('Authorization', `Bearer ${tokens.ADMIN}`).send({ reviewedBy: principals['Creator B'].id, status: 'APPROVED' });
    expect(approved.status).toBe(200);
    expect((await User.findByPk(principals.REGISTERED.id)).role).toBe('CREATOR');
    expect((await User.findByPk(principals['Creator B'].id)).role).toBe('CREATOR');
});

test('creator folder proposals need admin approval and song attachment enforces ownership', async () => {
    const proposed = await request(app).post('/api/folders/proposals')
        .set('Authorization', `Bearer ${tokens['Creator A']}`).send({ name: 'Parade Songs', description: 'Songs heard during the parade.' });
    expect(proposed.status).toBe(201);
    expect(proposed.body.folder.status).toBe('PENDING');
    expect((await request(app).put(`/api/folders/song/${resources.songA.id}/${proposed.body.folder.id}`).set('Authorization', `Bearer ${tokens['Creator A']}`)).status).toBe(404);

    expect((await request(app).patch(`/api/admin/folders/${proposed.body.folder.id}`).set('Authorization', `Bearer ${tokens.ADMIN}`).send({ status: 'APPROVED' })).status).toBe(200);
    expect((await request(app).put(`/api/folders/song/${resources.songA.id}/${proposed.body.folder.id}`).set('Authorization', `Bearer ${tokens['Creator B']}`)).status).toBe(404);
    expect((await request(app).put(`/api/folders/song/${resources.songA.id}/${proposed.body.folder.id}`).set('Authorization', `Bearer ${tokens['Creator A']}`)).status).toBe(201);
    expect(await SongFolder.count({ where: { folderId: proposed.body.folder.id, songId: resources.songA.id } })).toBe(1);
    expect((await Folder.findByPk(proposed.body.folder.id)).reviewedBy).toBe(principals.ADMIN.id);
});

test('only admins can issue warnings and inspect global moderation and audit history', async () => {
    expect((await request(app).post('/api/admin/warnings').set('Authorization', `Bearer ${tokens['Creator A']}`).send({ reason: 'No', userId: principals['Creator B'].id })).status).toBe(403);
    const warning = await request(app).post('/api/admin/warnings').set('Authorization', `Bearer ${tokens.ADMIN}`).send({ reason: 'Repeatedly submitted abusive public content.', userId: principals['Creator B'].id, issuedBy: principals['Creator A'].id });
    expect(warning.status).toBe(201);
    expect((await UserWarning.findByPk(warning.body.warning.id)).issuedBy).toBe(principals.ADMIN.id);
    expect((await request(app).get('/api/admin/moderation-actions').set('Authorization', `Bearer ${tokens.ADMIN}`)).status).toBe(200);
    expect((await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${tokens.ADMIN}`)).status).toBe(200);
});

test('admin suspension is enforced from the current database record even for an existing token', async () => {
    const suspend = await request(app).patch(`/api/admin/creators/${principals['Creator B'].id}/status`)
        .set('Authorization', `Bearer ${tokens.ADMIN}`).send({ accountStatus: 'SUSPENDED' });
    expect(suspend.status).toBe(200);
    expect((await request(app).get('/api/songs/creator').set('Authorization', `Bearer ${tokens['Creator B']}`)).status).toBe(403);
    const reactivate = await request(app).patch(`/api/admin/creators/${principals['Creator B'].id}/status`)
        .set('Authorization', `Bearer ${tokens.ADMIN}`).send({ accountStatus: 'ACTIVE' });
    expect(reactivate.status).toBe(200);
});
