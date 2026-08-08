/**
 * Owner: Lia
 * Feature: Song Reporting
 */

const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'song-report.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, ModerationAction, Song, SongReport, User, UserWarning, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const passwordHash = hashPassword('password123');
let admin;
let creator;
let reporter;
let otherReporter;
let song;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    admin = await User.create({ email: 'report-admin@example.com', name: 'Report Admin', passwordHash, role: 'ADMIN' });
    creator = await User.create({ email: 'report-creator@example.com', name: 'Report Creator', passwordHash, role: 'CREATOR' });
    reporter = await User.create({ email: 'report-reporter@example.com', name: 'Report Reporter', passwordHash, role: 'REGISTERED' });
    otherReporter = await User.create({ email: 'report-other@example.com', name: 'Other Reporter', passwordHash, role: 'REGISTERED' });
});

beforeEach(async () => {
    await SongReport.destroy({ where: {} });
    await Song.destroy({ where: {} });
    song = await Song.create({
        artist: 'Report Creator', creatorId: creator.id, publishedDate: new Date(), status: 'PUBLISHED', title: 'Reported Song',
    });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('reporting a song requires authentication', async () => {
    const response = await request(app).post(`/api/songs/${song.id}/report`).send({ reason: 'SPAM' });
    expect(response.status).toBe(401);
});

test('an invalid or missing reason is rejected', async () => {
    const response = await request(app)
        .post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'NOT_A_REAL_REASON' });
    expect(response.status).toBe(400);
    expect(await SongReport.count()).toBe(0);
});

test('a valid report on a published song is stored as PENDING', async () => {
    const response = await request(app)
        .post(`/api/songs/${song.id}/report`).set(auth(reporter))
        .send({ details: 'This song uses uncredited copyrighted audio.', reason: 'copyright' });
    expect(response.status).toBe(201);
    expect(response.body.report).toMatchObject({ reason: 'COPYRIGHT', status: 'PENDING' });
    const stored = await SongReport.findOne({ where: { songId: song.id, userId: reporter.id } });
    expect(stored).toMatchObject({
        details: 'This song uses uncredited copyrighted audio.', reason: 'COPYRIGHT', status: 'PENDING',
    });
});

test('a second pending report from the same user for the same song is rejected as a duplicate', async () => {
    await request(app).post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'SPAM' });
    const duplicate = await request(app)
        .post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'INAPPROPRIATE' });
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.code).toBe('ALREADY_REPORTED');
    expect(await SongReport.count({ where: { songId: song.id, userId: reporter.id } })).toBe(1);

    const fromAnotherUser = await request(app)
        .post(`/api/songs/${song.id}/report`).set(auth(otherReporter)).send({ reason: 'SPAM' });
    expect(fromAnotherUser.status).toBe(201);
});

test('the reported flag on the public song list persists for the reporter across requests but not for others or guests', async () => {
    await request(app).post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'SPAM' });

    const asReporter = await request(app).get('/api/songs').set(auth(reporter));
    expect(asReporter.body.songs.find((item) => item.id === song.id).reported).toBe(true);

    const asOtherUser = await request(app).get('/api/songs').set(auth(otherReporter));
    expect(asOtherUser.body.songs.find((item) => item.id === song.id).reported).toBe(false);

    const asGuest = await request(app).get('/api/songs');
    expect(asGuest.body.songs.find((item) => item.id === song.id).reported).toBe(false);
});

test('reporting a non-existent or unpublished song returns 404', async () => {
    const missing = await request(app)
        .post('/api/songs/11111111-1111-4111-8111-111111111111/report').set(auth(reporter)).send({ reason: 'SPAM' });
    expect(missing.status).toBe(404);

    const draft = await Song.create({ creatorId: creator.id, status: 'DRAFT', title: 'Unpublished Song' });
    const draftResponse = await request(app)
        .post(`/api/songs/${draft.id}/report`).set(auth(reporter)).send({ reason: 'SPAM' });
    expect(draftResponse.status).toBe(404);
});

test('admin song-reports queue lists pending reports and non-admins are rejected', async () => {
    await request(app).post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'SPAM' });

    const forbidden = await request(app).get('/api/admin/song-reports').set(auth(reporter));
    expect(forbidden.status).toBe(403);

    const response = await request(app).get('/api/admin/song-reports').set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.reports).toHaveLength(1);
    expect(response.body.reports[0]).toMatchObject({ reason: 'SPAM', songId: song.id, status: 'PENDING' });
    expect(response.body.songSummary).toEqual([
        expect.objectContaining({ pendingCount: 1, songId: song.id, songTitle: 'Reported Song' }),
    ]);
});

test('the song multi-select filter narrows results and sort=mostReported orders by pending count', async () => {
    const quiet = await Song.create({
        artist: 'Report Creator', creatorId: creator.id, publishedDate: new Date(), status: 'PUBLISHED', title: 'Quiet Song',
    });
    await request(app).post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'SPAM' });
    await request(app).post(`/api/songs/${song.id}/report`).set(auth(otherReporter)).send({ reason: 'INAPPROPRIATE' });
    await request(app).post(`/api/songs/${quiet.id}/report`).set(auth(reporter)).send({ reason: 'METADATA' });

    const mostReported = await request(app).get('/api/admin/song-reports').set(auth(admin)).query({ sort: 'mostReported' });
    expect(mostReported.body.reports.map((report) => report.songId)).toEqual([song.id, song.id, quiet.id]);

    const filtered = await request(app).get('/api/admin/song-reports').set(auth(admin)).query({ songIds: quiet.id });
    expect(filtered.body.reports).toHaveLength(1);
    expect(filtered.body.reports[0].songId).toBe(quiet.id);
});

test('resolving a song report writes a ModerationAction and AuditLog entry and rejects a second resolution', async () => {
    const created = await request(app)
        .post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'INAPPROPRIATE' });
    const reportId = created.body.report.id;

    const response = await request(app).post(`/api/admin/song-reports/${reportId}/resolve`)
        .set(auth(admin)).send({ outcome: 'DISMISS_REPORT', reason: 'The song does not violate platform policy.' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ outcome: 'DISMISS_REPORT', report: { status: 'DISMISSED' } });

    const action = await ModerationAction.findOne({ where: { actionType: 'SONG_REPORT_DISMISSED', targetId: song.id } });
    expect(action).toMatchObject({ songId: song.id, targetType: 'SONG', targetUserId: creator.id });
    expect(await AuditLog.findOne({ where: { action: 'SONG_REPORT_DISMISSED', entityId: song.id, entityType: 'SONG' } })).not.toBeNull();

    const duplicate = await request(app).post(`/api/admin/song-reports/${reportId}/resolve`)
        .set(auth(admin)).send({ outcome: 'MARK_REVIEWED', reason: 'A second outcome must not overwrite the first.' });
    expect(duplicate.status).toBe(409);

    // The moderation action is now visible via the general moderation-actions feed (targetType whitelist includes SONG).
    const actionsFeed = await request(app).get('/api/admin/moderation-actions').set(auth(admin)).query({ targetType: 'SONG' });
    expect(actionsFeed.status).toBe(200);
    expect(actionsFeed.body.actions.some((item) => item.targetId === song.id)).toBe(true);
});

test('removing a song via a report outcome archives the song without deleting it', async () => {
    const created = await request(app)
        .post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'INAPPROPRIATE' });
    const response = await request(app).post(`/api/admin/song-reports/${created.body.report.id}/resolve`)
        .set(auth(admin)).send({ outcome: 'REMOVE_SONG', reason: 'The song violates platform policy and is removed.' });
    expect(response.status).toBe(200);
    await song.reload();
    expect(song.status).toBe('ARCHIVED');
    expect(await Song.findByPk(song.id)).not.toBeNull();
    expect((await request(app).get(`/api/songs/${song.id}`)).status).toBe(404);
});

test('a warning can be issued against a song creator and appears with its song source', async () => {
    const response = await request(app).post('/api/admin/warnings').set(auth(admin))
        .send({ reason: 'Repeated copyright concerns across songs.', sourceId: song.id, sourceType: 'SONG', userId: creator.id });
    expect(response.status).toBe(201);
    expect(response.body.source).toMatchObject({ id: song.id, type: 'SONG' });
    expect(await UserWarning.count({ where: { userId: creator.id } })).toBe(1);

    const list = await request(app).get('/api/admin/warnings').set(auth(admin)).query({ userId: creator.id });
    expect(list.status).toBe(200);
    expect(list.body.warnings[0].source).toMatchObject({ id: song.id, type: 'SONG' });

    const mismatchedOwner = await request(app).post('/api/admin/warnings').set(auth(admin))
        .send({ reason: 'This does not belong to the reporter.', sourceId: song.id, sourceType: 'SONG', userId: reporter.id });
    expect(mismatchedOwner.status).toBe(409);
});

test('the Users tab safety aggregation reflects a creator\'s pending song reports', async () => {
    await request(app).post(`/api/songs/${song.id}/report`).set(auth(reporter)).send({ reason: 'SPAM' });

    const safetyUsers = await request(app).get('/api/admin/users').set(auth(admin)).query({ scope: 'safety' });
    expect(safetyUsers.status).toBe(200);
    const creatorRow = safetyUsers.body.users.find((user) => user.id === creator.id);
    expect(creatorRow).toBeTruthy();
    expect(creatorRow.flaggedContentCount).toBeGreaterThanOrEqual(1);
    expect(creatorRow.pendingSongReportCount).toBe(1);
});
