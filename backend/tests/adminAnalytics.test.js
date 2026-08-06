const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'admin-analytics.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AnalyticsEvent, CreatorApplication, Folder, FolderSongProposal, Reflection,
    Song, User, UserWarning, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const passwordHash = hashPassword('password123');
let admin;
let registered;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    admin = await User.create({ email: 'summary-admin@example.com', name: 'Summary Admin', passwordHash, role: 'ADMIN' });
    const creator = await User.create({ email: 'summary-creator@example.com', name: 'Summary Creator', passwordHash, role: 'CREATOR' });
    registered = await User.create({ email: 'summary-user@example.com', name: 'Summary User', passwordHash, role: 'REGISTERED' });
    await CreatorApplication.create({ status: 'SUBMITTED', userId: registered.id });
    const song = await Song.create({ artist: creator.name, creatorId: creator.id, status: 'PUBLISHED', title: 'Summary Song' });
    const folder = await Folder.create({ createdBy: admin.id, name: 'Summary Collection', slug: 'summary-collection' });
    await FolderSongProposal.create({ folderId: folder.id, proposedBy: creator.id, songId: song.id, status: 'PENDING' });
    await Reflection.create({ content: 'A flagged reflection', songId: song.id, status: 'FLAGGED', userId: registered.id });
    await UserWarning.create({ issuedBy: admin.id, reason: 'A current warning', userId: registered.id });
    await AnalyticsEvent.bulkCreate([
        { eventType: 'SONG_PAGE_VIEWED', songId: song.id },
        { eventType: 'SONG_PAGE_VIEWED', songId: song.id },
        { eventType: 'SONG_PLAYBACK_STARTED', songId: song.id },
    ]);
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('admin analytics returns authoritative tab counts and real listening events', async () => {
    const response = await request(app).get('/api/admin/analytics').set(authorization(admin));

    expect(response.status).toBe(200);
    expect(response.body.tabCounts).toEqual({
        collections: 1,
        creatorApplications: 1,
        creators: 1,
        placementRequests: 1,
        reports: 1,
        songs: 1,
        users: 1,
        warnings: 1,
    });
    expect(response.body.activitySeries.reduce((total, day) => total + day.views, 0)).toBe(2);
    expect(response.body.activitySeries.reduce((total, day) => total + day.playbacks, 0)).toBe(1);
});

test('admin analytics remains protected by administrator authorisation', async () => {
    const response = await request(app).get('/api/admin/analytics').set(authorization(registered));
    expect(response.status).toBe(403);
    expect(response.body.tabCounts).toBeUndefined();
});
