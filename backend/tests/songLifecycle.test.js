const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const testDatabasePath = path.join(__dirname, 'song-lifecycle.test.sqlite');
process.env.DB_STORAGE = testDatabasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, GenerationJob, Song, User } = require('../models');
const { completeGeneration, failGeneration, usePlaceholderVideo } = require('../controllers/generationController');
const { createToken, hashPassword } = require('../services/authService');
const cloudinaryService = require('../services/cloudinaryService');

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

test('creator can upload and replace an owned cover image while another creator cannot', async () => {
    const song = await Song.create({ creatorId: creator.id, status: 'DRAFT', title: 'Cover Test' });
    const upload = jest.spyOn(cloudinaryService, 'uploadImageBuffer')
        .mockResolvedValueOnce({ public_id: 'covers/first', secure_url: 'https://media.example/first.jpg' })
        .mockResolvedValueOnce({ public_id: 'covers/second', secure_url: 'https://media.example/second.jpg' });
    const remove = jest.spyOn(cloudinaryService, 'deleteImage').mockResolvedValue({ deleted: true });

    const forbidden = await request(app)
        .post(`/api/songs/${song.id}/cover`).set(auth(otherToken))
        .attach('coverImage', Buffer.from('image'), { contentType: 'image/png', filename: 'cover.png' });
    expect(forbidden.status).toBe(404);
    expect(upload).not.toHaveBeenCalled();

    const first = await request(app)
        .post(`/api/songs/${song.id}/cover`).set(auth(creatorToken))
        .attach('coverImage', Buffer.from('first'), { contentType: 'image/png', filename: 'first.png' });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
        coverImagePublicId: 'covers/first', coverImageUrl: 'https://media.example/first.jpg',
    });

    const second = await request(app)
        .post(`/api/songs/${song.id}/cover`).set(auth(creatorToken))
        .attach('coverImage', Buffer.from('second'), { contentType: 'image/jpeg', filename: 'second.jpg' });
    expect(second.status).toBe(200);
    expect(second.body.coverImagePublicId).toBe('covers/second');
    expect(remove).toHaveBeenCalledWith('covers/first');
    upload.mockRestore();
    remove.mockRestore();
});

test('generation start uses an existing Song id and creates no duplicate Song row', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'DRAFT' });
    const before = await Song.count();
    const response = await request(app)
        .post('/api/generation/start').set(auth(creatorToken)).send({ songId: song.id });
    expect(response.status).toBe(202);
    expect(response.body.data.songId).toBe(song.id);
    expect(await Song.count()).toBe(before);
    await song.reload();
    expect(song.status).toBe('GENERATING');
});

test('duplicate active generation jobs are rejected and retry is allowed only after failure', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'DRAFT' });
    const first = await request(app)
        .post('/api/generation/start').set(auth(creatorToken)).send({ songId: song.id });
    const duplicate = await request(app)
        .post('/api/generation/start').set(auth(creatorToken)).send({ songId: song.id });
    expect(first.status).toBe(202);
    expect(duplicate.status).toBe(409);
    expect(await GenerationJob.count({ where: { songId: song.id } })).toBe(1);

    await failGeneration(first.body.data.id, new Error('Provider unavailable'));
    const retry = await request(app)
        .post('/api/generation/start').set(auth(creatorToken)).send({ songId: song.id });
    expect(retry.status).toBe(202);
    expect(retry.body.data.songId).toBe(song.id);
    expect(await GenerationJob.count({ where: { songId: song.id } })).toBe(2);
    expect(await Song.count()).toBe(1);
});

test('another creator cannot start generation or view an owned generation job', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'DRAFT' });
    const job = await GenerationJob.create({ songId: song.id, status: 'QUEUED' });
    const start = await request(app)
        .post('/api/generation/start').set(auth(otherToken)).send({ songId: song.id });
    const detail = await request(app)
        .get(`/api/generation/${job.id}/status`).set(auth(otherToken));
    const list = await request(app).get('/api/generation').set(auth(otherToken));
    expect(start.status).toBe(404);
    expect(detail.status).toBe(404);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(0);
});

test('failed generation preserves the Song and permits a clean retry state', async () => {
    const song = await Song.create({ ...completeSong, videoUrl: null, creatorId: creator.id, status: 'GENERATING' });
    const job = await GenerationJob.create({ songId: song.id, status: 'PROCESSING' });
    await failGeneration(job.id, new Error('Frame provider failed'));
    await Promise.all([song.reload(), job.reload()]);
    expect(job.status).toBe('FAILED');
    expect(job.errorMessage).toBe('Frame provider failed');
    expect(song.status).toBe('DRAFT');
    expect(await Song.findByPk(song.id)).not.toBeNull();
});

test('configured placeholder completion stores temporary video data, sets READY, and never publishes', async () => {
    const previous = process.env.PLACEHOLDER_VIDEO_URL;
    process.env.PLACEHOLDER_VIDEO_URL = 'https://media.example/temporary-generation.mp4';
    const song = await Song.create({ ...completeSong, videoUrl: null, creatorId: creator.id, status: 'GENERATING' });
    const job = await GenerationJob.create({ songId: song.id, status: 'PROCESSING' });
    await usePlaceholderVideo(song.id);
    await completeGeneration(job.id);
    await Promise.all([song.reload(), job.reload()]);
    expect(job.status).toBe('COMPLETED');
    expect(song.videoUrl).toBe('https://media.example/temporary-generation.mp4');
    expect(song.videoPublicId).toBeNull();
    expect(song.status).toBe('READY');
    expect(song.publishedDate).toBeNull();
    if (previous === undefined) delete process.env.PLACEHOLDER_VIDEO_URL;
    else process.env.PLACEHOLDER_VIDEO_URL = previous;
});

test('creator dashboard summary returns correct scoped lifecycle counts and recent activity', async () => {
    for (const status of ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']) {
        await Song.create({ creatorId: creator.id, status, title: `${status} owned` });
    }
    const otherSong = await Song.create({ creatorId: otherCreator.id, status: 'PUBLISHED', title: 'Other creator' });
    await GenerationJob.create({ songId: otherSong.id, status: 'COMPLETED' });
    const owned = await Song.findOne({ where: { creatorId: creator.id, status: 'GENERATING' } });
    await GenerationJob.create({ songId: owned.id, status: 'PROCESSING' });

    const response = await request(app)
        .get('/api/songs/creator/dashboard/summary').set(auth(creatorToken));
    expect(response.status).toBe(200);
    expect(response.body.counts).toEqual({
        total: 5, DRAFT: 1, GENERATING: 1, READY: 1, PUBLISHED: 1, ARCHIVED: 1,
    });
    expect(response.body.recentSongs).toHaveLength(5);
    expect(response.body.recentSongs.every((song) => song.creatorId === creator.id)).toBe(true);
    expect(response.body.generationJobs).toHaveLength(1);
    expect(response.body.generationJobs[0].song.title).toBe('GENERATING owned');
    expect(response.body.playAnalyticsAvailable).toBe(false);
});

test('archive enforces ownership, removes public visibility, and appears in creator refresh', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'PUBLISHED', publishedDate: new Date() });
    const forbidden = await request(app).put(`/api/songs/${song.id}/archive`).set(auth(otherToken));
    expect(forbidden.status).toBe(404);
    const archived = await request(app).put(`/api/songs/${song.id}/archive`).set(auth(creatorToken));
    expect(archived.status).toBe(200);
    expect(archived.body.song).toMatchObject({ status: 'ARCHIVED', publishedDate: null });
    expect((await request(app).get(`/api/songs/${song.id}`)).status).toBe(404);
    const list = await request(app).get('/api/songs/creator').set(auth(creatorToken));
    expect(list.body.songs.find((item) => item.id === song.id).status).toBe('ARCHIVED');
});

test('delete enforces ownership, deletes the Song, and attempts all Cloudinary cleanup', async () => {
    const cleanup = jest.spyOn(cloudinaryService, 'deleteAsset').mockResolvedValue({ deleted: true });
    const song = await Song.create({
        ...completeSong, creatorId: creator.id, status: 'READY',
        audioPublicId: 'audio/id', coverImagePublicId: 'cover/id', videoPublicId: 'video/id',
    });
    const segment = await require('../models').SceneSegment.create({
        songId: song.id, startTime: 0, endTime: 5, visualPrompt: 'A scene',
    });
    await require('../models').GeneratedFrame.create({
        sceneSegmentId: segment.id, imageUrl: 'https://media.example/frame.jpg', cloudinaryId: 'frame/id',
    });
    const forbidden = await request(app).delete(`/api/songs/${song.id}`).set(auth(otherToken));
    expect(forbidden.status).toBe(404);
    expect(await Song.findByPk(song.id)).not.toBeNull();

    const deleted = await request(app).delete(`/api/songs/${song.id}`).set(auth(creatorToken));
    expect(deleted.status).toBe(200);
    expect(deleted.body).toMatchObject({ deleted: true, id: song.id, cleanupFailures: 0 });
    expect(await Song.findByPk(song.id)).toBeNull();
    expect(cleanup).toHaveBeenCalledWith('cover/id', 'image');
    expect(cleanup).toHaveBeenCalledWith('audio/id', 'video');
    expect(cleanup).toHaveBeenCalledWith('video/id', 'video');
    expect(cleanup).toHaveBeenCalledWith('frame/id', 'image');
    cleanup.mockRestore();
});

test('creator list refresh reflects publish and unpublish mutations', async () => {
    const song = await Song.create({ ...completeSong, creatorId: creator.id, status: 'READY' });
    await GenerationJob.create({ songId: song.id, status: 'COMPLETED' });
    await request(app).put(`/api/songs/${song.id}/publish`).set(auth(creatorToken));
    let list = await request(app).get('/api/songs/creator').set(auth(creatorToken));
    expect(list.body.songs.find((item) => item.id === song.id).status).toBe('PUBLISHED');
    await request(app).put(`/api/songs/${song.id}/unpublish`).set(auth(creatorToken));
    list = await request(app).get('/api/songs/creator').set(auth(creatorToken));
    expect(list.body.songs.find((item) => item.id === song.id).status).toBe('READY');
});

test('public song search and filters return only matching published Songs with public metadata', async () => {
    const matching = await Song.create({
        ...completeSong, creatorId: creator.id, status: 'PUBLISHED', publishedDate: new Date(),
        languages: ['English', 'Malay'], moodTags: ['Hopeful'], theme: 'Community', title: 'River Home',
    });
    await Song.create({ ...completeSong, creatorId: creator.id, status: 'PUBLISHED', title: 'Different Song', languages: ['Tamil'], moodTags: ['Joyful'], theme: 'History' });
    await Song.create({ ...completeSong, creatorId: creator.id, status: 'READY', title: 'River Draft', languages: ['Malay'], moodTags: ['Hopeful'], theme: 'Community' });

    const response = await request(app).get('/api/songs').query({
        search: 'river', language: 'malay', mood: 'hopeful', theme: 'Community',
    });
    expect(response.status).toBe(200);
    expect(response.body.songs.map((song) => song.id)).toEqual([matching.id]);
    expect(response.body.songs[0]).toMatchObject({
        artist: 'Test Artist', coverImageUrl: completeSong.coverImageUrl,
        description: completeSong.description, languages: ['English', 'Malay'], theme: 'Community', title: 'River Home',
    });
});
