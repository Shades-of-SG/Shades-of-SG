const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
process.env.OTP_TEST_CODE = '246810';
const databasePath = path.join(__dirname, 'auth-onboarding.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { AuthOtp, CreatorApplication, User, sequelize } = require('../models');
const { createToken, hashPassword, verifyPassword } = require('../services/authService');
const { getTestOutbox, resetEmailTransportForTests } = require('../services/emailService');
const { resetRateLimitsForTests } = require('../middleware/rateLimit');

const registration = (email, overrides = {}) => ({
    acceptPrivacy: true,
    acceptTerms: true,
    email,
    name: 'New Listener',
    password: 'password123',
    role: 'ADMIN',
    ...overrides,
});

const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` });

async function createVerifiedUser(values = {}) {
    return User.create({
        email: values.email || `verified-${Math.random()}@example.com`,
        emailVerificationRequired: false,
        emailVerifiedAt: new Date(),
        name: values.name || 'Verified User',
        passwordHash: hashPassword(values.password || 'password123'),
        role: values.role || 'REGISTERED',
        ...values,
    });
}

beforeAll(async () => {
    await sequelize.sync({ force: true });
});

beforeEach(() => {
    process.env.OTP_TEST_CODE = '246810';
    resetRateLimitsForTests();
    resetEmailTransportForTests();
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('registration creates only an unverified REGISTERED account and sends a hashed six-digit OTP', async () => {
    const response = await request(app).post('/api/auth/register').send(registration('  New.User@Example.COM  '));
    expect(response.status).toBe(201);
    expect(response.body).not.toHaveProperty('token');
    const user = await User.findOne({ where: { email: 'new.user@example.com' } });
    expect(user).toMatchObject({ emailVerificationRequired: true, role: 'REGISTERED' });
    const otp = await AuthOtp.findOne({ where: { email: user.email, purpose: 'REGISTRATION' } });
    expect(otp.otpHash).not.toContain('246810');
    expect(otp.expiresAt.getTime() - otp.createdAt.getTime()).toBeLessThanOrEqual(10 * 60 * 1000 + 1000);
    expect(getTestOutbox()).toHaveLength(1);
});

test('registration validates agreements and rejects duplicate normalized emails', async () => {
    expect((await request(app).post('/api/auth/register').send(registration('terms@example.com', { acceptTerms: false }))).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send(registration('duplicate@example.com'))).status).toBe(201);
    expect((await request(app).post('/api/auth/register').send(registration(' DUPLICATE@example.com '))).status).toBe(409);
});

test('unverified users cannot log in or use a forged bearer session', async () => {
    await request(app).post('/api/auth/register').send(registration('unverified@example.com'));
    const user = await User.findOne({ where: { email: 'unverified@example.com' } });
    const login = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123' });
    expect(login.status).toBe(403);
    expect(login.body.code).toBe('EMAIL_UNVERIFIED');
    expect((await request(app).get('/api/auth/me').set(auth(user))).status).toBe(403);
});

test('correct registration OTP verifies email and permits login with database role data', async () => {
    await request(app).post('/api/auth/register').send(registration('verify-success@example.com'));
    expect((await request(app).post('/api/auth/verify-email').send({ code: '246810', email: 'verify-success@example.com' })).status).toBe(200);
    const user = await User.findOne({ where: { email: 'verify-success@example.com' } });
    expect(user.emailVerificationRequired).toBe(false);
    expect(user.emailVerifiedAt).toBeTruthy();
    const login = await request(app).post('/api/auth/login').send({ email: 'VERIFY-SUCCESS@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.user).toMatchObject({ emailVerified: true, role: 'REGISTERED' });
    expect(login.body.user).not.toHaveProperty('passwordHash');
});

test('incorrect and expired OTPs are rejected', async () => {
    await request(app).post('/api/auth/register').send(registration('otp-errors@example.com'));
    expect((await request(app).post('/api/auth/verify-email').send({ code: '111111', email: 'otp-errors@example.com' })).status).toBe(400);
    expect((await AuthOtp.findOne({ where: { email: 'otp-errors@example.com' } })).attemptCount).toBe(1);
    await AuthOtp.update({ expiresAt: new Date(Date.now() - 1000) }, { where: { email: 'otp-errors@example.com' } });
    const expired = await request(app).post('/api/auth/verify-email').send({ code: '246810', email: 'otp-errors@example.com' });
    expect(expired.status).toBe(400);
    expect(expired.body.message).toMatch(/expired/i);
});

test('OTP locks after five incorrect attempts', async () => {
    await request(app).post('/api/auth/register').send(registration('otp-limit@example.com'));
    for (let attempt = 1; attempt <= 4; attempt += 1) {
        expect((await request(app).post('/api/auth/verify-email').send({ code: '000000', email: 'otp-limit@example.com' })).status).toBe(400);
    }
    expect((await request(app).post('/api/auth/verify-email').send({ code: '000000', email: 'otp-limit@example.com' })).status).toBe(429);
    const otp = await AuthOtp.findOne({ where: { email: 'otp-limit@example.com' } });
    expect(otp).toMatchObject({ attemptCount: 5 });
    expect(otp.usedAt).toBeTruthy();
});

test('resend cooldown applies and a later resend invalidates the previous OTP', async () => {
    process.env.OTP_TEST_CODE = '111111';
    await request(app).post('/api/auth/register').send(registration('resend@example.com'));
    expect((await request(app).post('/api/auth/resend-verification').send({ email: 'resend@example.com' })).status).toBe(429);
    const oldOtp = await AuthOtp.findOne({ where: { email: 'resend@example.com' } });
    await sequelize.query('UPDATE auth_otps SET created_at = :createdAt WHERE id = :id', {
        replacements: { createdAt: new Date(Date.now() - 61 * 1000), id: oldOtp.id },
    });
    process.env.OTP_TEST_CODE = '222222';
    expect((await request(app).post('/api/auth/resend-verification').send({ email: 'resend@example.com' })).status).toBe(202);
    await oldOtp.reload();
    expect(oldOtp.usedAt).toBeTruthy();
    expect((await request(app).post('/api/auth/verify-email').send({ code: '111111', email: 'resend@example.com' })).status).toBe(400);
    expect((await request(app).post('/api/auth/verify-email').send({ code: '222222', email: 'resend@example.com' })).status).toBe(200);
});

test('password reset request is account-enumeration safe', async () => {
    await createVerifiedUser({ email: 'recovery@example.com' });
    const existing = await request(app).post('/api/auth/password-reset/request').send({ email: 'recovery@example.com' });
    const missing = await request(app).post('/api/auth/password-reset/request').send({ email: 'missing@example.com' });
    expect(existing.status).toBe(202);
    expect(missing.status).toBe(202);
    expect(existing.body).toEqual(missing.body);
});

test('OTP requests are limited independently by requesting IP even when emails change', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
        const response = await request(app).post('/api/auth/password-reset/request').send({ email: `unknown-${attempt}@example.com` });
        expect(response.status).toBe(202);
    }
    const limited = await request(app).post('/api/auth/password-reset/request').send({ email: 'another-address@example.com' });
    expect(limited.status).toBe(429);
    expect(limited.headers['retry-after']).toBeTruthy();
});

test('password reset succeeds once and invalidates existing bearer tokens', async () => {
    const user = await createVerifiedUser({ email: 'reset-success@example.com' });
    const oldToken = createToken(user);
    await request(app).post('/api/auth/password-reset/request').send({ email: user.email });
    const verified = await request(app).post('/api/auth/password-reset/verify').send({ code: '246810', email: user.email });
    expect(verified.status).toBe(200);
    const completed = await request(app).post('/api/auth/password-reset/complete').send({ password: 'new-password123', resetToken: verified.body.resetToken });
    expect(completed.status).toBe(200);
    await user.reload();
    expect(verifyPassword('new-password123', user.passwordHash)).toBe(true);
    expect((await request(app).get('/api/auth/me').set('Authorization', `Bearer ${oldToken}`)).status).toBe(401);
    expect((await request(app).post('/api/auth/password-reset/complete').send({ password: 'another-password', resetToken: verified.body.resetToken })).status).toBe(400);
});

test('suspended users are refused login even with the correct password', async () => {
    await createVerifiedUser({ accountStatus: 'SUSPENDED', email: 'suspended-login@example.com' });
    const response = await request(app).post('/api/auth/login').send({ email: 'suspended-login@example.com', password: 'password123' });
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/suspended/i);
    expect(response.body).not.toHaveProperty('token');
});

test('login returns ADMIN and CREATOR roles from the database without a role selector', async () => {
    const admin = await createVerifiedUser({ email: 'role-admin@example.com', role: 'ADMIN' });
    const creator = await createVerifiedUser({ email: 'role-creator@example.com', role: 'CREATOR' });
    for (const [user, role] of [[admin, 'ADMIN'], [creator, 'CREATOR']]) {
        const response = await request(app).post('/api/auth/login').send({ email: user.email, password: 'password123', role: 'REGISTERED' });
        expect(response.status).toBe(200);
        expect(response.body.user.role).toBe(role);
    }
});

test('creator applications validate resumes, prevent duplicates, hide internal notes, and preserve roles on rejection', async () => {
    const applicant = await createVerifiedUser({ email: 'application-reject@example.com' });
    const admin = await createVerifiedUser({ email: 'application-admin@example.com', role: 'ADMIN' });
    const draft = await request(app).put('/api/creator-applications/draft').set(auth(applicant)).send({
        contentIdeas: 'A learning series about National Day song arrangements.',
        experience: 'Community music workshops', guidelinesAccepted: true,
        introduction: 'I teach music in community spaces.',
        motivation: 'I want to help more people understand Singapore songs and the stories behind them.',
    });
    expect(draft.status).toBe(200);
    expect((await request(app).post(`/api/creator-applications/${draft.body.application.id}/resume`).set(auth(applicant)).attach('resume', Buffer.from('bad'), { contentType: 'text/plain', filename: 'resume.txt' })).status).toBe(400);
    expect((await request(app).post(`/api/creator-applications/${draft.body.application.id}/resume`).set(auth(applicant)).attach('resume', Buffer.from('not really a PDF'), { contentType: 'application/pdf', filename: 'spoofed.pdf' })).status).toBe(400);
    expect((await request(app).post(`/api/creator-applications/${draft.body.application.id}/resume`).set(auth(applicant)).attach('resume', Buffer.from('%PDF-1.4 resume'), { contentType: 'application/pdf', filename: 'resume.pdf' })).status).toBe(200);
    expect((await request(app).post(`/api/creator-applications/${draft.body.application.id}/submit`).set(auth(applicant))).status).toBe(200);
    expect((await request(app).put('/api/creator-applications/draft').set(auth(applicant)).send({ introduction: 'duplicate' })).status).toBe(409);
    await CreatorApplication.update({ adminNotes: 'Private administrator note' }, { where: { id: draft.body.application.id } });
    const mine = await request(app).get('/api/creator-applications/mine').set(auth(applicant));
    expect(mine.body.applications[0]).not.toHaveProperty('adminNotes');
    const rejected = await request(app).patch(`/api/admin/creator-applications/${draft.body.application.id}/status`).set(auth(admin)).send({ adminNotes: 'Still private', applicantFeedback: 'Please develop the proposal further.', status: 'REJECTED' });
    expect(rejected.status).toBe(200);
    expect((await User.findByPk(applicant.id)).role).toBe('REGISTERED');
});

test('admin approval upgrades the existing verified user instead of creating a duplicate account', async () => {
    const applicant = await createVerifiedUser({ email: 'application-approve@example.com' });
    const admin = await User.findOne({ where: { email: 'application-admin@example.com' } });
    const application = await CreatorApplication.create({
        contentIdeas: 'National Day oral histories', experience: 'Music production', guidelinesAccepted: true,
        introduction: 'Producer', motivation: 'I want to contribute educational Singapore music resources for the public.',
        portfolioUrl: 'https://example.com/portfolio', status: 'SUBMITTED', submittedAt: new Date(), userId: applicant.id,
    });
    const approved = await request(app).patch(`/api/admin/creator-applications/${application.id}/status`).set(auth(admin)).send({ status: 'APPROVED' });
    expect(approved.status).toBe(200);
    expect((await User.findByPk(applicant.id)).role).toBe('CREATOR');
    expect(await User.count({ where: { email: applicant.email } })).toBe(1);
});
