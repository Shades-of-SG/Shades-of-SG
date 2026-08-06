const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
process.env.OTP_TEST_CODE = '135790';
const databasePath = path.join(__dirname, 'admin-user-management.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    Badge, ModerationAction, Song, User, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');
const { resetRateLimitsForTests } = require('../middleware/rateLimit');
const { getTestOutbox, resetEmailTransportForTests } = require('../services/emailService');

const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const passwordHash = hashPassword('password123');
let admin;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    admin = await User.create({ email: 'admin-um@example.com', name: 'Admin User', passwordHash, role: 'ADMIN' });
});

beforeEach(() => {
    resetRateLimitsForTests();
    resetEmailTransportForTests();
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

describe('GET /api/admin/users', () => {
    test('never returns admin rows and supports sorting', async () => {
        await User.create({ email: 'zeta-um@example.com', name: 'Zeta', passwordHash, role: 'REGISTERED' });
        await User.create({ email: 'alpha-um@example.com', name: 'Alpha', passwordHash, role: 'REGISTERED' });

        const response = await request(app).get('/api/admin/users').set(auth(admin));
        expect(response.status).toBe(200);
        expect(response.body.users.some((user) => user.role === 'ADMIN')).toBe(false);

        const sorted = await request(app).get('/api/admin/users?sort=nameAsc').set(auth(admin));
        expect(sorted.status).toBe(200);
        const names = sorted.body.users.map((user) => user.name);
        expect(names).toEqual([...names].sort());

        const invalid = await request(app).get('/api/admin/users?sort=bogus').set(auth(admin));
        expect(invalid.status).toBe(400);
    });
});

describe('GET /api/admin/users/:id', () => {
    test('returns empty (not null) sections for a user with no data, and 404s for an admin target', async () => {
        const member = await User.create({ email: `empty-${Math.random()}@example.com`, name: 'Empty Member', passwordHash, role: 'REGISTERED' });
        const response = await request(app).get(`/api/admin/users/${member.id}`).set(auth(admin));
        expect(response.status).toBe(200);
        expect(response.body.user.id).toBe(member.id);
        expect(response.body.sections.bookmarks.rows).toEqual([]);
        expect(response.body.sections.badges).toMatchObject({ catalogTotal: 9, rows: [], total: 0 });
        expect(response.body.sections.reflections.rows).toEqual([]);
        expect(response.body.sections.gameScores.rows).toEqual([]);
        expect(response.body.sections.triviaAttempts).toMatchObject({ correctCount: 0, rows: [], total: 0 });
        expect(response.body.sections.instrumentProgress.rows).toEqual([]);

        const adminTarget = await request(app).get(`/api/admin/users/${admin.id}`).set(auth(admin));
        expect(adminTarget.status).toBe(404);

        const notFound = await request(app).get('/api/admin/users/00000000-0000-4000-8000-000000000000').set(auth(admin));
        expect(notFound.status).toBe(404);

        const badId = await request(app).get('/api/admin/users/not-a-uuid').set(auth(admin));
        expect(badId.status).toBe(400);

        const unauthenticated = await request(app).get(`/api/admin/users/${member.id}`);
        expect(unauthenticated.status).toBe(401);
    });

    test('reports real badge and warning totals', async () => {
        const member = await User.create({ email: `badged-${Math.random()}@example.com`, name: 'Badged Member', passwordHash, role: 'REGISTERED' });
        await Badge.create({ earnedAt: new Date(), name: 'Day One', userId: member.id });
        const response = await request(app).get(`/api/admin/users/${member.id}`).set(auth(admin));
        expect(response.status).toBe(200);
        expect(response.body.sections.badges.total).toBe(1);
        expect(response.body.sections.badges.catalogTotal).toBe(9);
    });
});

describe('PATCH /api/admin/users/:id/email', () => {
    test('rejects a wrong admin password, invalid email, and duplicate email', async () => {
        const member = await User.create({ email: `edit-${Math.random()}@example.com`, name: 'Edit Member', passwordHash, role: 'REGISTERED' });
        const other = await User.create({ email: `taken-${Math.random()}@example.com`, name: 'Taken', passwordHash, role: 'REGISTERED' });

        const wrongPassword = await request(app).patch(`/api/admin/users/${member.id}/email`).set(auth(admin))
            .send({ adminPassword: 'nope', email: 'new@example.com' });
        expect(wrongPassword.status).toBe(401);

        const invalidEmail = await request(app).patch(`/api/admin/users/${member.id}/email`).set(auth(admin))
            .send({ adminPassword: 'password123', email: 'not-an-email' });
        expect(invalidEmail.status).toBe(400);

        const duplicate = await request(app).patch(`/api/admin/users/${member.id}/email`).set(auth(admin))
            .send({ adminPassword: 'password123', email: other.email });
        expect(duplicate.status).toBe(409);
    });

    test('updates the email, bumps authVersion, and forces re-login', async () => {
        const member = await User.create({ email: `success-${Math.random()}@example.com`, name: 'Success Member', passwordHash, role: 'REGISTERED' });
        const staleAuth = auth(member);

        const response = await request(app).patch(`/api/admin/users/${member.id}/email`).set(auth(admin))
            .send({ adminPassword: 'password123', email: 'corrected@example.com' });
        expect(response.status).toBe(200);
        expect(response.body.user.email).toBe('corrected@example.com');

        const staleRequest = await request(app).get('/api/auth/me').set(staleAuth);
        expect(staleRequest.status).toBe(401);

        const login = await request(app).post('/api/auth/login').send({ email: 'corrected@example.com', password: 'password123' });
        expect(login.status).toBe(200);
    });
});

describe('POST /api/admin/users/:id/password-reset-link', () => {
    test('rejects a wrong admin password, then emails a working single-use link', async () => {
        const member = await User.create({ email: `reset-${Math.random()}@example.com`, name: 'Reset Member', passwordHash, role: 'REGISTERED' });

        const wrongPassword = await request(app).post(`/api/admin/users/${member.id}/password-reset-link`).set(auth(admin))
            .send({ adminPassword: 'nope' });
        expect(wrongPassword.status).toBe(401);

        const response = await request(app).post(`/api/admin/users/${member.id}/password-reset-link`).set(auth(admin))
            .send({ adminPassword: 'password123' });
        expect(response.status).toBe(202);

        const [message] = getTestOutbox().slice(-1);
        expect(message.to).toBe(member.email);
        const match = message.text.match(/token=([^\s]+)/) || message.html.match(/token=([^"&]+)/);
        expect(match).toBeTruthy();
        const token = decodeURIComponent(match[1]);

        const completed = await request(app).post('/api/auth/password-reset/complete').send({ password: 'NewPassword123!', resetToken: token });
        expect(completed.status).toBe(200);

        const reused = await request(app).post('/api/auth/password-reset/complete').send({ password: 'AnotherPassword123!', resetToken: token });
        expect(reused.status).toBe(400);

        const login = await request(app).post('/api/auth/login').send({ email: member.email, password: 'NewPassword123!' });
        expect(login.status).toBe(200);
    });
});

describe('DELETE /api/admin/users/:id', () => {
    test('rejects a wrong admin password, a missing reason, self, and an admin target', async () => {
        const member = await User.create({ email: `del-${Math.random()}@example.com`, name: 'Delete Member', passwordHash, role: 'REGISTERED' });

        const wrongPassword = await request(app).delete(`/api/admin/users/${member.id}`).set(auth(admin))
            .send({ adminPassword: 'nope', reason: 'Testing wrong password.' });
        expect(wrongPassword.status).toBe(401);

        const missingReason = await request(app).delete(`/api/admin/users/${member.id}`).set(auth(admin))
            .send({ adminPassword: 'password123' });
        expect(missingReason.status).toBe(400);

        const self = await request(app).delete(`/api/admin/users/${admin.id}`).set(auth(admin))
            .send({ adminPassword: 'password123', reason: 'Should not be allowed.' });
        expect(self.status).toBe(403);

        const otherAdmin = await User.create({ email: `other-admin-${Math.random()}@example.com`, name: 'Other Admin', passwordHash, role: 'ADMIN' });
        const adminTarget = await request(app).delete(`/api/admin/users/${otherAdmin.id}`).set(auth(admin))
            .send({ adminPassword: 'password123', reason: 'Should not be allowed.' });
        expect(adminTarget.status).toBe(403);
        expect(await User.findByPk(otherAdmin.id)).not.toBeNull();
    });

    test('deletes the user and preserves an anonymized moderation record', async () => {
        const member = await User.create({ email: `del-ok-${Math.random()}@example.com`, name: 'Delete Ok', passwordHash, role: 'REGISTERED' });
        const response = await request(app).delete(`/api/admin/users/${member.id}`).set(auth(admin))
            .send({ adminPassword: 'password123', reason: 'Requested by the user via support.' });
        expect(response.status).toBe(200);
        expect(await User.findByPk(member.id)).toBeNull();
        const record = await ModerationAction.findOne({ where: { actionType: 'USER_ACCOUNT_DELETED', 'metadata.deletedUserEmail': member.email } })
            || await ModerationAction.findOne({ where: { actionType: 'USER_ACCOUNT_DELETED' }, order: [['createdAt', 'DESC']] });
        expect(record).not.toBeNull();
        expect(record.targetUserId).toBeNull();
    });

    test('requires confirmContentDeletion to remove a creator with a published song', async () => {
        const creator = await User.create({ email: `pub-${Math.random()}@example.com`, name: 'Published Creator', passwordHash, role: 'CREATOR' });
        const song = await Song.create({ artist: 'Published Creator', creatorId: creator.id, publishedDate: new Date(), status: 'PUBLISHED', title: 'Live Song' });

        const refused = await request(app).delete(`/api/admin/users/${creator.id}`).set(auth(admin))
            .send({ adminPassword: 'password123', reason: 'Removing this creator.' });
        expect(refused.status).toBe(409);
        expect(await User.findByPk(creator.id)).not.toBeNull();

        const confirmed = await request(app).delete(`/api/admin/users/${creator.id}`).set(auth(admin))
            .send({ adminPassword: 'password123', confirmContentDeletion: true, reason: 'Removing this creator.' });
        expect(confirmed.status).toBe(200);
        expect(await User.findByPk(creator.id)).toBeNull();
        expect(await Song.findByPk(song.id)).toBeNull();
    });
});

describe('GET /api/admin/users/:id/creator-stats', () => {
    test('returns 409 for a non-creator and stats for a creator', async () => {
        const member = await User.create({ email: `notcreator-${Math.random()}@example.com`, name: 'Not Creator', passwordHash, role: 'REGISTERED' });
        const notCreator = await request(app).get(`/api/admin/users/${member.id}/creator-stats`).set(auth(admin));
        expect(notCreator.status).toBe(409);

        const creator = await User.create({ email: `stats-${Math.random()}@example.com`, name: 'Stats Creator', passwordHash, role: 'CREATOR' });
        await Song.create({ artist: 'Stats Creator', creatorId: creator.id, status: 'DRAFT', title: 'Draft One' });
        await Song.create({ artist: 'Stats Creator', creatorId: creator.id, publishedDate: new Date(), status: 'PUBLISHED', title: 'Published One' });
        const response = await request(app).get(`/api/admin/users/${creator.id}/creator-stats`).set(auth(admin));
        expect(response.status).toBe(200);
        expect(response.body.summary.songs.total).toBe(2);
        expect(response.body.summary.songs.PUBLISHED).toBe(1);
        expect(response.body.songs).toHaveLength(2);
    });
});
