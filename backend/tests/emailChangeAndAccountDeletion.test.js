const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
process.env.OTP_TEST_CODE = '135790';
const databasePath = path.join(__dirname, 'email-change-account-deletion.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, User } = require('../models');
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

    test('soft-deletes the account without removing the row and blocks future login', async () => {
        const response = await request(app)
            .delete('/api/auth/account')
            .set(authorization(user))
            .send({ password: 'password123' });
        expect(response.status).toBe(200);

        const stillExists = await User.findByPk(user.id);
        expect(stillExists).not.toBeNull();
        expect(stillExists.accountStatus).toBe('DELETED');
        expect(stillExists.deletedAt).toBeTruthy();
        expect(stillExists.email).toBe(user.email);

        const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
        expect(login.status).toBe(403);
        expect(login.body.message).toMatch(/deleted/i);
    });
});
