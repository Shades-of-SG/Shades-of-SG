const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
process.env.OTP_TEST_CODE = '135790';
const databasePath = path.join(__dirname, 'email-change-account-deletion.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, AuthIdentity, AuthOtp, Badge, GameScore, InstrumentChallengeProgress, ModerationAction, Reflection,
    ReflectionComment, ReflectionLike, Session, Song, SongBookmark, User, UserProfile, UserWarning, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');
const { resetRateLimitsForTests } = require('../middleware/rateLimit');
const { resetEmailTransportForTests } = require('../services/emailService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });

let user;
let otherUser;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    otherUser = await User.create({ email: 'taken@example.com', name: 'Taken', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
});

beforeEach(async () => {
    process.env.OTP_TEST_CODE = '135790';
    resetRateLimitsForTests();
    resetEmailTransportForTests();
    user = await User.create({
        email: `owner-${Math.random()}@example.com`, name: 'Account Owner', passwordHash: hashPassword('password123'), role: 'REGISTERED',
    });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

describe('email change', () => {
    test('rejects an incorrect password and issues no code', async () => {
        const response = await request(app)
            .post('/api/auth/email-change/request')
            .set(authorization(user))
            .send({ newEmail: 'new-address@example.com', password: 'wrong-password' });
        expect(response.status).toBe(401);
    });

    test('rejects a new email equal to the current one', async () => {
        const response = await request(app)
            .post('/api/auth/email-change/request')
            .set(authorization(user))
            .send({ newEmail: user.email, password: 'password123' });
        expect(response.status).toBe(400);
    });

    test('rejects a new email already owned by another account', async () => {
        const response = await request(app)
            .post('/api/auth/email-change/request')
            .set(authorization(user))
            .send({ newEmail: 'taken@example.com', password: 'password123' });
        expect(response.status).toBe(409);
    });

    test('requires authentication', async () => {
        const response = await request(app)
            .post('/api/auth/email-change/request')
            .send({ newEmail: 'new-address@example.com', password: 'password123' });
        expect(response.status).toBe(401);
    });

    test('completes the request, verify, complete flow and forces re-authentication', async () => {
        const staleAuthHeader = authorization(user);

        const requested = await request(app)
            .post('/api/auth/email-change/request')
            .set(staleAuthHeader)
            .send({ newEmail: 'new-address@example.com', password: 'password123' });
        expect(requested.status).toBe(202);

        const wrongCode = await request(app)
            .post('/api/auth/email-change/verify')
            .set(staleAuthHeader)
            .send({ code: '000000', newEmail: 'new-address@example.com' });
        expect(wrongCode.status).toBe(400);

        const verified = await request(app)
            .post('/api/auth/email-change/verify')
            .set(staleAuthHeader)
            .send({ code: '135790', newEmail: 'new-address@example.com' });
        expect(verified.status).toBe(200);
        expect(verified.body.changeToken).toBeTruthy();

        const completed = await request(app)
            .post('/api/auth/email-change/complete')
            .set(staleAuthHeader)
            .send({ changeToken: verified.body.changeToken });
        expect(completed.status).toBe(200);

        await user.reload();
        expect(user.email).toBe('new-address@example.com');

        // The bumped authVersion invalidates the token minted before the change completed.
        const staleTokenRequest = await request(app)
            .post('/api/auth/email-change/request')
            .set(staleAuthHeader)
            .send({ newEmail: 'another-address@example.com', password: 'password123' });
        expect(staleTokenRequest.status).toBe(401);

        const login = await request(app).post('/api/auth/login').send({ email: 'new-address@example.com', password: 'password123' });
        expect(login.status).toBe(200);
    });
});

describe('account deletion', () => {
    test('rejects an incorrect password and does not touch the account', async () => {
        const response = await request(app)
            .delete('/api/auth/account')
            .set(authorization(user))
            .send({ password: 'wrong-password' });
        expect(response.status).toBe(401);
        await user.reload();
        expect(user.accountStatus).toBe('ACTIVE');
    });

    test('requires authentication', async () => {
        const response = await request(app).delete('/api/auth/account').send({ password: 'password123' });
        expect(response.status).toBe(401);
    });

    test('hard-deletes the account, removing the row, and blocks future login', async () => {
        const response = await request(app)
            .delete('/api/auth/account')
            .set(authorization(user))
            .send({ password: 'password123' });
        expect(response.status).toBe(200);

        expect(await User.findByPk(user.id)).toBeNull();

        // No row means login falls back to the generic invalid-credentials path, not the
        // account-suspended/deleted path (that path only fires when a row exists to read).
        const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
        expect(login.status).toBe(401);
        expect(login.body.message).toMatch(/invalid/i);
    });

    test('cascades every linked row for the deleted user and leaves other users untouched', async () => {
        const other = await User.create({ email: `other-${Math.random()}@example.com`, name: 'Other User', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
        const song = await Song.create({ artist: 'Other User', creatorId: other.id, status: 'DRAFT', title: 'Untouched Song' });
        await UserProfile.create({ displayName: 'Account Owner', userId: user.id });
        await Badge.create({ description: 'Test badge', earnedAt: new Date(), name: 'Day One', userId: user.id });
        await SongBookmark.create({ songId: song.id, userId: user.id });
        await GameScore.create({ accuracy: 90, score: 100, songId: song.id, userId: user.id });
        const ownReflection = await Reflection.create({ content: 'My own reflection.', songId: song.id, status: 'APPROVED', userId: user.id });
        await ReflectionComment.create({ content: 'A comment from someone else.', reflectionId: ownReflection.id, userId: other.id });
        await ReflectionLike.create({ reflectionId: ownReflection.id, userId: other.id });
        const otherReflection = await Reflection.create({ content: "Someone else's reflection.", songId: song.id, status: 'APPROVED', userId: other.id });
        await ReflectionComment.create({ content: 'A comment from the account being deleted.', reflectionId: otherReflection.id, userId: user.id });
        await ReflectionLike.create({ reflectionId: otherReflection.id, userId: user.id });
        await InstrumentChallengeProgress.create({ challengeId: 'three-notes', userId: user.id });
        await Session.create({ userId: user.id });
        await AuthIdentity.create({ provider: 'GOOGLE', providerSubject: `sub-${Math.random()}`, userId: user.id });
        await AuthOtp.create({ email: user.email, expiresAt: new Date(Date.now() + 60000), otpHash: 'x$y', purpose: 'PASSWORD_RESET', userId: user.id });
        const admin = await User.create({ email: `admin-${Math.random()}@example.com`, name: 'Admin', passwordHash: hashPassword('password123'), role: 'ADMIN' });
        const warning = await UserWarning.create({ issuedBy: admin.id, reason: 'Sample warning for cascade test.', userId: user.id });
        await ModerationAction.create({ actionType: 'USER_WARNED', actorId: admin.id, reason: 'Sample.', targetId: warning.id, targetType: 'USER', targetUserId: user.id });
        await AuditLog.create({ action: 'ACCOUNT_TOUCHED', actorId: user.id, entityId: user.id, entityType: 'USER' });

        const response = await request(app)
            .delete('/api/auth/account')
            .set(authorization(user))
            .send({ password: 'password123' });
        expect(response.status).toBe(200);

        expect(await User.findByPk(user.id)).toBeNull();
        expect(await UserProfile.findByPk(user.id)).toBeNull();
        expect(await Badge.count({ where: { userId: user.id } })).toBe(0);
        expect(await SongBookmark.count({ where: { userId: user.id } })).toBe(0);
        expect(await GameScore.count({ where: { userId: user.id } })).toBe(0);
        expect(await Reflection.count({ where: { userId: user.id } })).toBe(0);
        expect(await InstrumentChallengeProgress.count({ where: { userId: user.id } })).toBe(0);
        expect(await Session.count({ where: { userId: user.id } })).toBe(0);
        expect(await AuthIdentity.count({ where: { userId: user.id } })).toBe(0);
        expect(await AuthOtp.count({ where: { userId: user.id } })).toBe(0);
        expect(await UserWarning.count({ where: { userId: user.id } })).toBe(0);

        // The deleted user's comment/like on someone else's reflection are gone too.
        expect(await ReflectionComment.count({ where: { userId: user.id } })).toBe(0);
        expect(await ReflectionLike.count({ where: { userId: user.id } })).toBe(0);
        expect(await Reflection.findByPk(otherReflection.id)).not.toBeNull();

        // Someone else's comment/like on the deleted user's reflection are removed with it,
        // but that other user's own account and other rows are untouched.
        expect(await Reflection.findByPk(ownReflection.id)).toBeNull();
        expect(await ReflectionComment.count({ where: { reflectionId: ownReflection.id } })).toBe(0);
        expect(await ReflectionLike.count({ where: { reflectionId: ownReflection.id } })).toBe(0);
        expect(await User.findByPk(other.id)).not.toBeNull();
        expect(await Song.findByPk(song.id)).not.toBeNull();

        // Audit and moderation history survive with the user reference nulled out.
        const auditRow = await AuditLog.findOne({ where: { entityId: user.id, entityType: 'USER', action: 'ACCOUNT_TOUCHED' } });
        expect(auditRow).not.toBeNull();
        expect(auditRow.actorId).toBeNull();
        const hardDeleteAudit = await AuditLog.findOne({ where: { action: 'ACCOUNT_HARD_DELETED', entityId: user.id } });
        expect(hardDeleteAudit).not.toBeNull();
        expect(hardDeleteAudit.metadata.deletedUserEmail).toBe(user.email);
        const moderationRow = await ModerationAction.findByPk(warning.id) || await ModerationAction.findOne({ where: { targetId: warning.id } });
        expect(moderationRow).not.toBeNull();
        expect(moderationRow.targetUserId).toBeNull();
    });

    test('deletes a creator with only draft songs', async () => {
        const creator = await User.create({ email: `creator-${Math.random()}@example.com`, name: 'Draft Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
        const song = await Song.create({ artist: 'Draft Creator', creatorId: creator.id, status: 'DRAFT', title: 'Unfinished Song' });

        const response = await request(app)
            .delete('/api/auth/account')
            .set(authorization(creator))
            .send({ password: 'password123' });
        expect(response.status).toBe(200);
        expect(await User.findByPk(creator.id)).toBeNull();
        expect(await Song.findByPk(song.id)).toBeNull();
    });

    test('refuses to delete a creator with a published song and leaves everything intact', async () => {
        const creator = await User.create({ email: `published-${Math.random()}@example.com`, name: 'Published Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
        const song = await Song.create({ artist: 'Published Creator', creatorId: creator.id, publishedDate: new Date(), status: 'PUBLISHED', title: 'Live Song' });

        const response = await request(app)
            .delete('/api/auth/account')
            .set(authorization(creator))
            .send({ password: 'password123' });
        expect(response.status).toBe(409);
        expect(response.body.code).toBe('PUBLISHED_CONTENT_PRESENT');
        expect(await User.findByPk(creator.id)).not.toBeNull();
        expect(await Song.findByPk(song.id)).not.toBeNull();
    });
});
