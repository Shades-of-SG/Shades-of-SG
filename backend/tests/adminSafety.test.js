/**
 * Owners: Ferlyn, Lia
 * Feature: Administrator Community & Safety
 */
const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'admin-safety.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, ModerationAction, Reflection, ReflectionComment, Song, User, UserWarning, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const passwordHash = hashPassword('password123');
let admin;
let creator;
let member;
let song;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    admin = await User.create({ email: 'safety-admin@example.com', name: 'Safety Admin', passwordHash, role: 'ADMIN' });
    creator = await User.create({ email: 'safety-creator@example.com', name: 'Safety Creator', passwordHash, role: 'CREATOR' });
    member = await User.create({ email: 'safety-member@example.com', name: 'Safety Member', passwordHash, role: 'REGISTERED' });
    song = await Song.create({
        artist: 'Safety Creator', creatorId: creator.id, publishedDate: new Date(), status: 'PUBLISHED', title: 'Safety Context Song',
    });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

async function flaggedReflection(content = 'Original evidence remains available to an administrator.') {
    return Reflection.create({
        content, moderatedAt: new Date(), moderatedBy: creator.id,
        moderatorNote: 'Creator escalated this reflection for platform review.', songId: song.id,
        status: 'FLAGGED', userId: member.id,
    });
}

test('open safety cases group real flag events, expose evidence and context, and preserve reporter privacy', async () => {
    const older = await flaggedReflection('Older open evidence.');
    await older.update({ moderatedAt: new Date('2026-07-01T00:00:00.000Z') });
    const latest = await flaggedReflection('Latest open evidence with a long, factual context.');
    await ReflectionComment.create({ content: 'Surrounding discussion context.', reflectionId: latest.id, userId: creator.id });
    await ModerationAction.bulkCreate([
        { actionType: 'REFLECTION_FLAGGED', actorId: creator.id, reason: 'Creator safety concern.', songId: song.id, targetId: latest.id, targetType: 'REFLECTION', targetUserId: member.id },
        { actionType: 'REFLECTION_FLAGGED', actorId: admin.id, reason: 'Administrator confirmed review is required.', songId: song.id, targetId: latest.id, targetType: 'REFLECTION', targetUserId: member.id },
    ]);
    const resolved = await Reflection.create({ content: 'Already resolved evidence.', songId: song.id, status: 'APPROVED', userId: member.id });
    await ModerationAction.create({ actionType: 'SAFETY_REPORT_DISMISSED', actorId: admin.id, reason: 'Resolved.', songId: song.id, targetId: resolved.id, targetType: 'REFLECTION', targetUserId: member.id });

    const response = await request(app).get('/api/admin/safety-reports').set(auth(admin));
    expect(response.status).toBe(200);
    expect(response.body.reports.map((report) => report.id)).toEqual([latest.id, older.id]);
    expect(response.body.reports.every((report) => report.reviewState === 'OPEN')).toBe(true);
    const grouped = response.body.reports[0];
    expect(grouped).toMatchObject({
        caseTypes: expect.arrayContaining(['CREATOR_ESCALATION', 'ADMIN_FLAG']),
        content: latest.content, reportCount: 2, requiredAction: 'ADMIN_REVIEW', targetType: 'REFLECTION',
    });
    expect(grouped.comments[0]).toMatchObject({ content: 'Surrounding discussion context.', status: 'VISIBLE' });
    expect(JSON.stringify(grouped)).not.toMatch(/reporter/i);
    expect(response.body.reports.some((report) => report.id === resolved.id)).toBe(false);
});

test('report outcomes are explicit, preserve evidence, create audit rows, and reject duplicate transitions', async () => {
    const reflection = await flaggedReflection('Evidence survives dismissal.');
    const response = await request(app).post(`/api/admin/safety-reports/${reflection.id}/resolve`)
        .set(auth(admin)).send({ outcome: 'DISMISS_REPORT', reason: 'The reflection does not violate platform policy.' });
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ outcome: 'DISMISS_REPORT', userNotificationSent: false });
    expect(await reflection.reload()).toMatchObject({ content: 'Evidence survives dismissal.', status: 'APPROVED' });
    expect(await ModerationAction.findOne({ where: { actionType: 'SAFETY_REPORT_DISMISSED', targetId: reflection.id } })).not.toBeNull();
    expect(await AuditLog.findOne({ where: { action: 'SAFETY_REPORT_DISMISSED', entityId: reflection.id } })).not.toBeNull();

    const duplicate = await request(app).post(`/api/admin/safety-reports/${reflection.id}/resolve`)
        .set(auth(admin)).send({ outcome: 'REMOVE_REFLECTION', reason: 'A second outcome must not overwrite the first.' });
    expect(duplicate.status).toBe(409);
    expect((await reflection.reload()).status).toBe('APPROVED');
    expect((await request(app).post('/api/admin/safety-reports/not-an-id/resolve').set(auth(admin))
        .send({ outcome: 'DISMISS_REPORT', reason: 'Malformed target.' })).status).toBe(400);
});

test('hiding a reflection removes public eligibility while retaining the original row and unrelated member data', async () => {
    const reflection = await flaggedReflection('Harmful reflection evidence is retained.');
    const before = { songs: await Song.count({ where: { creatorId: creator.id } }), users: await User.count() };
    const response = await request(app).post(`/api/admin/safety-reports/${reflection.id}/resolve`)
        .set(auth(admin)).send({ outcome: 'REMOVE_REFLECTION', reason: 'The reflection contains a clear policy violation.' });
    expect(response.status).toBe(200);
    expect(await reflection.reload()).toMatchObject({ content: 'Harmful reflection evidence is retained.', status: 'REJECTED' });
    expect({ songs: await Song.count({ where: { creatorId: creator.id } }), users: await User.count() }).toEqual(before);
});

test('linked warnings require reasons, prevent active duplicates, and remain after reasoned resolution', async () => {
    const reflection = await flaggedReflection('Warning source evidence.');
    expect((await request(app).post('/api/admin/warnings').set(auth(admin)).send({ reason: '', userId: member.id })).status).toBe(400);
    const body = {
        reason: 'Do not submit abusive public reflections.', sourceId: reflection.id,
        sourceType: 'REFLECTION', userId: member.id,
    };
    const created = await request(app).post('/api/admin/warnings').set(auth(admin)).send(body);
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ source: { id: reflection.id, type: 'REFLECTION' }, userNotificationSent: false });
    expect((await request(app).post('/api/admin/warnings').set(auth(admin)).send(body)).status).toBe(409);
    expect((await request(app).patch(`/api/admin/warnings/${created.body.warning.id}/resolve`).set(auth(admin))
        .send({ resolutionNote: '' })).status).toBe(400);
    const resolved = await request(app).patch(`/api/admin/warnings/${created.body.warning.id}/resolve`).set(auth(admin))
        .send({ resolutionNote: 'The member acknowledged the issue and the review is complete.' });
    expect(resolved.status).toBe(200);
    expect((await request(app).patch(`/api/admin/warnings/${created.body.warning.id}/resolve`).set(auth(admin))
        .send({ resolutionNote: 'Duplicate resolution.' })).status).toBe(409);
    expect(await UserWarning.findByPk(created.body.warning.id)).toMatchObject({ status: 'RESOLVED' });
    const history = await request(app).get(`/api/admin/warnings?userId=${member.id}`).set(auth(admin));
    expect(history.body.warnings[0]).toMatchObject({ source: { id: reflection.id, type: 'REFLECTION' }, status: 'RESOLVED' });
});

test('member suspension has explicit unchanged public-content behavior and safe, reasoned transitions', async () => {
    const memberReflection = await Reflection.create({ content: 'Stored member data.', songId: song.id, status: 'APPROVED', userId: member.id });
    expect((await request(app).patch(`/api/admin/users/${admin.id}/status`).set(auth(admin))
        .send({ accountStatus: 'SUSPENDED', reason: 'Unsafe self-action.' })).status).toBe(403);
    expect((await request(app).patch(`/api/admin/users/${member.id}/status`).set(auth(admin))
        .send({ accountStatus: 'ACTIVE', reason: 'Already active.' })).status).toBe(409);
    const suspended = await request(app).patch(`/api/admin/users/${member.id}/status`).set(auth(admin))
        .send({ accountStatus: 'SUSPENDED', reason: 'Repeated platform-wide safety violations require suspension.' });
    expect(suspended.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth(member))).status).toBe(403);
    expect((await song.reload()).status).toBe('PUBLISHED');
    expect(await Reflection.findByPk(memberReflection.id)).not.toBeNull();
    const action = await ModerationAction.findOne({ where: { actionType: 'USER_SUSPENDED', targetUserId: member.id } });
    expect(action.metadata).toMatchObject({ publishedContentBehavior: 'UNCHANGED' });
    expect((await request(app).patch(`/api/admin/users/${member.id}/status`).set(auth(admin))
        .send({ accountStatus: 'SUSPENDED', reason: 'Duplicate suspension.' })).status).toBe(409);
    const restored = await request(app).patch(`/api/admin/users/${member.id}/status`).set(auth(admin))
        .send({ accountStatus: 'ACTIVE', reason: 'Safety review confirms the existing account can be restored.' });
    expect(restored.status).toBe(200);
    expect((await request(app).get('/api/auth/me').set(auth(member))).status).toBe(200);
    expect((await User.findByPk(member.id)).accountStatus).toBe('ACTIVE');
});

test('creator and member states stay distinct in safety users and focused action history', async () => {
    const suspended = await request(app).patch(`/api/admin/creators/${creator.id}/status`).set(auth(admin))
        .send({ creatorAccessStatus: 'SUSPENDED', reason: 'Creator tools require a focused safety review.' });
    expect(suspended.status).toBe(200);
    expect(suspended.body.creator).toMatchObject({ accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED' });
    expect((await request(app).get('/api/auth/me').set(auth(creator))).status).toBe(200);
    expect((await request(app).get('/api/songs/creator').set(auth(creator))).status).toBe(403);
    const users = await request(app).get('/api/admin/users?scope=safety').set(auth(admin));
    expect(users.body.users.find((user) => user.id === creator.id)).toMatchObject({ accountStatus: 'ACTIVE', creatorAccessStatus: 'SUSPENDED' });
    const history = await request(app).get('/api/admin/moderation-actions?scope=safety&actionType=CREATOR_SUSPENDED').set(auth(admin));
    expect(history.status).toBe(200);
    expect(history.body.actions[0]).toMatchObject({ actionType: 'CREATOR_SUSPENDED', targetUserId: creator.id });
    expect((await request(app).patch(`/api/admin/creators/${creator.id}/status`).set(auth(admin))
        .send({ creatorAccessStatus: 'ACTIVE', reason: 'Creator safety review is complete.' })).status).toBe(200);
});
