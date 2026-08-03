const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'user-safety.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, ModerationFlag, Notification, Reflection, Song, User, UserWarning, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');
const { resetRateLimitsForTests } = require('../middleware/rateLimit');

const passwordHash = hashPassword('password123');
const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
let admin;
let member;
let other;
let creator;
let song;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    [admin, member, other, creator] = await Promise.all([
        User.create({ email: 'admin-safety@example.com', name: 'Admin', passwordHash, role: 'ADMIN' }),
        User.create({ email: 'member-safety@example.com', name: 'Member', passwordHash, role: 'REGISTERED' }),
        User.create({ email: 'other-safety@example.com', name: 'Other', passwordHash, role: 'REGISTERED' }),
        User.create({ email: 'creator-safety@example.com', name: 'Creator', passwordHash, role: 'CREATOR' }),
    ]);
    song = await Song.create({ creatorId: creator.id, status: 'PUBLISHED', title: 'Safety Song' });
});

beforeEach(async () => {
    resetRateLimitsForTests();
    await Promise.all([
        AuditLog.destroy({ where: {} }), ModerationFlag.destroy({ where: {} }), Notification.destroy({ where: {} }),
        Reflection.destroy({ where: {} }), UserWarning.destroy({ where: {} }),
    ]);
    await member.update({ accountStatus: 'ACTIVE', accountSuspensionReason: null });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('owner safety API returns only the current user warnings and omits private moderation data', async () => {
    const reflection = await Reflection.create({ content: 'Private affected reflection', displayMode: 'PROFILE', songId: song.id, status: 'REJECTED', userId: member.id });
    const own = await UserWarning.create({
        category: 'HARASSMENT', internalNote: 'Reporter identity and investigation detail.', issuedBy: admin.id,
        reason: 'Legacy compatible reason.', targetId: reflection.id, targetType: 'REFLECTION',
        userFacingReason: 'Your reflection was found to contain targeted harassment.', userId: member.id,
    });
    await UserWarning.create({ issuedBy: admin.id, reason: 'Other user warning.', userFacingReason: 'Other user warning.', userId: other.id });
    const response = await request(app).get('/api/safety/account-status').set(auth(member));
    expect(response.status).toBe(200);
    expect(response.body.warnings).toHaveLength(1);
    expect(response.body.warnings[0]).toMatchObject({ category: 'HARASSMENT', id: own.id, status: 'ACTIVE', target: { status: 'REJECTED', type: 'REFLECTION' } });
    expect(response.body.warnings[0]).not.toHaveProperty('internalNote');
    expect(response.body.warnings[0]).not.toHaveProperty('issuedBy');
    expect(JSON.stringify(response.body)).not.toContain('Reporter identity');
});

test('active warnings can be acknowledged only by their owner without changing content or access', async () => {
    const reflection = await Reflection.create({ content: 'Preserved evidence', songId: song.id, status: 'REJECTED', userId: member.id });
    const warning = await UserWarning.create({ issuedBy: admin.id, reason: 'Review this decision.', targetId: reflection.id, targetType: 'REFLECTION', userFacingReason: 'Review this decision.', userId: member.id });
    expect((await request(app).patch(`/api/safety/warnings/${warning.id}/acknowledge`).set(auth(other))).status).toBe(404);
    const response = await request(app).patch(`/api/safety/warnings/${warning.id}/acknowledge`).set(auth(member));
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ACKNOWLEDGED');
    expect((await request(app).patch(`/api/safety/warnings/${warning.id}/acknowledge`).set(auth(member))).status).toBe(409);
    expect((await warning.reload()).acknowledgedAt).toBeTruthy();
    expect((await reflection.reload()).status).toBe('REJECTED');
    expect((await member.reload()).accountStatus).toBe('ACTIVE');
    expect(await AuditLog.findOne({ where: { action: 'USER_WARNING_ACKNOWLEDGED', entityId: warning.id } })).not.toBeNull();
});

test('warning issuance creates an authoritative warning and owner-linked in-product notification', async () => {
    const response = await request(app).post('/api/admin/warnings').set(auth(admin)).send({
        actionTaken: 'Formal warning issued; member account remains active.', category: 'SPAM',
        internalNote: 'Private investigation context.', requiredNextStep: 'Acknowledge this warning.',
        userFacingReason: 'Repeated identical promotional content was removed.', userId: member.id,
    });
    expect(response.status).toBe(201);
    expect(response.body.userNotificationSent).toBe(true);
    const notification = await Notification.findOne({ where: { userId: member.id, warningId: response.body.warning.id } });
    expect(notification.link).toBe(`/settings/safety?warning=${response.body.warning.id}`);
    const ownerView = await request(app).get('/api/safety/account-status').set(auth(member));
    expect(ownerView.body.notifications[0]).toMatchObject({ title: 'You received a formal warning', warningId: response.body.warning.id });
    expect(JSON.stringify(ownerView.body)).not.toContain('Private investigation context');
});

test('all supported warning states remain distinct in the user view', async () => {
    await Promise.all(['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'WITHDRAWN'].map((status) => UserWarning.create({
        acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date() : null,
        issuedBy: admin.id, reason: `${status} warning reason.`, status,
        userFacingReason: `${status} warning reason.`, userId: member.id,
    })));
    const response = await request(app).get('/api/safety/account-status').set(auth(member));
    expect(response.body.warnings.map((warning) => warning.status).sort()).toEqual(['ACKNOWLEDGED', 'ACTIVE', 'RESOLVED', 'WITHDRAWN']);
    const withdrawn = response.body.warnings.find((warning) => warning.status === 'WITHDRAWN');
    expect(withdrawn).toMatchObject({
        mustAcknowledge: false,
        requiredNextStep: 'No action is required. This warning was withdrawn and does not indicate an upheld violation.',
        statusExplanation: expect.stringContaining('does not mean that you remain in violation'),
    });
});

test('automated comment signals create one reviewable flag and never suspend or warn the member', async () => {
    const reflection = await Reflection.create({ content: 'Public discussion', songId: song.id, status: 'APPROVED', userId: other.id });
    for (let attempt = 0; attempt < 2; attempt += 1) {
        const response = await request(app).post(`/api/reflections/${reflection.id}/comments`).set(auth(member)).send({ content: 'This contains fuck language.' });
        expect(response.status).toBe(400);
    }
    const flags = await ModerationFlag.findAll({ where: { source: 'AUTOMATED_RULE', targetUserId: member.id } });
    expect(flags).toHaveLength(1);
    expect(flags[0]).toMatchObject({ reviewState: 'OPEN', targetType: 'USER_BEHAVIOUR', triggeringRule: 'COMMENT_PROHIBITED_LANGUAGE' });
    expect((await member.reload()).accountStatus).toBe('ACTIVE');
    expect(await UserWarning.count({ where: { userId: member.id } })).toBe(0);
    const adminQueue = await request(app).get('/api/admin/moderation-flags?reviewState=OPEN').set(auth(admin));
    expect(adminQueue.body.flags).toHaveLength(1);
});

test('valid suspended credentials provide a limited signed status experience while normal auth stays blocked', async () => {
    await request(app).patch(`/api/admin/users/${member.id}/status`).set(auth(admin)).send({ accountStatus: 'SUSPENDED', reason: 'Repeated harmful behaviour requires account review.' });
    const login = await request(app).post('/api/auth/login').send({ email: member.email, password: 'password123' });
    expect(login.status).toBe(403);
    expect(login.body).toMatchObject({ code: 'ACCOUNT_SUSPENDED', reason: 'Repeated harmful behaviour requires account review.' });
    expect(login.body.suspensionStatusToken).toBeTruthy();
    const status = await request(app).post('/api/auth/suspension-status').send({ suspensionStatusToken: login.body.suspensionStatusToken });
    expect(status.status).toBe(200);
    expect(status.body.suspension).toMatchObject({ accountStatus: 'SUSPENDED', appealAvailable: false, reviewState: 'IN_EFFECT' });
    expect((await request(app).get('/api/safety/account-status').set(auth(member))).status).toBe(403);
    expect(await Song.findByPk(song.id)).not.toBeNull();
});
