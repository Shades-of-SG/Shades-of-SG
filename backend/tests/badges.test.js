const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'badges.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    Badge, InstrumentChallengeProgress, Reflection, sequelize, Song, User,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');
const { evaluateAndAward } = require('../services/badgeAwardService');
const { recordDailyActivity } = require('../services/streakService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
let creator;
let song;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ email: 'badge-creator@example.com', name: 'Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    song = await Song.create({ artist: 'Creator', creatorId: creator.id, status: 'PUBLISHED', title: 'Badge Song' });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

async function freshUser(email) {
    return User.create({ email, name: 'Badge Tester', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
}

function daysAgo(count) {
    return new Date(Date.now() - count * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

describe('login streak awarding', () => {
    test('first ever login awards Day One and does not double-count same-day activity', async () => {
        const user = await freshUser('streak-day-one@example.com');
        await recordDailyActivity(user);
        await recordDailyActivity(user);

        await user.reload();
        expect(user.currentLoginStreak).toBe(1);
        const badgeNames = (await Badge.findAll({ where: { userId: user.id } })).map((badge) => badge.name);
        expect(badgeNames).toEqual(['Day One']);
    });

    test('consecutive days increment the streak and award the matching badge, a gap resets it', async () => {
        const user = await freshUser('streak-consecutive@example.com');
        await user.update({ currentLoginStreak: 6, lastActiveDate: daysAgo(1), longestLoginStreak: 6 });

        await recordDailyActivity(user);
        await user.reload();
        expect(user.currentLoginStreak).toBe(7);
        let badgeNames = (await Badge.findAll({ where: { userId: user.id } })).map((badge) => badge.name);
        expect(badgeNames).toContain('7-Day Streak');

        await user.update({ lastActiveDate: daysAgo(5) });
        await recordDailyActivity(user);
        await user.reload();
        expect(user.currentLoginStreak).toBe(1);
        badgeNames = (await Badge.findAll({ where: { userId: user.id } })).map((badge) => badge.name);
        expect(badgeNames).toEqual(expect.arrayContaining(['Day One', '7-Day Streak']));
    });
});

describe('reflection badges', () => {
    test('submitting reflections through the API awards Thought Starter then Reflective Mind', async () => {
        const user = await freshUser('reflection-badges@example.com');
        const submitOne = () => request(app).post('/api/reflections').set(authorization(user)).send({ content: 'A memory worth keeping.', songId: song.id });

        const first = await submitOne();
        expect(first.status).toBe(201);
        expect((await Badge.findAll({ where: { userId: user.id } })).map((badge) => badge.name)).toEqual(['Thought Starter']);

        for (let count = 0; count < 4; count += 1) await submitOne();
        const badgeNames = (await Badge.findAll({ where: { userId: user.id } })).map((badge) => badge.name);
        expect(badgeNames).toEqual(expect.arrayContaining(['Thought Starter', 'Reflective Mind']));
        expect(await Reflection.count({ where: { userId: user.id } })).toBe(5);
    });
});

describe('instrument playground badge', () => {
    test('awards Playground Virtuoso only once all three challenges are complete', async () => {
        const user = await freshUser('instrument-badges@example.com');
        const complete = (challengeId) => request(app)
            .post(`/api/instrument-playground/challenges/${challengeId}/complete`)
            .set(authorization(user));

        await complete('three-notes');
        await complete('lowest-note');
        expect(await Badge.count({ where: { name: 'Playground Virtuoso', userId: user.id } })).toBe(0);

        const last = await complete('highest-note');
        expect(last.status).toBe(202);
        expect(await Badge.count({ where: { name: 'Playground Virtuoso', userId: user.id } })).toBe(1);
        expect(await InstrumentChallengeProgress.count({ where: { userId: user.id } })).toBe(3);
    });

    test('rejects unknown challenge ids', async () => {
        const user = await freshUser('instrument-badges-invalid@example.com');
        const response = await request(app)
            .post('/api/instrument-playground/challenges/not-a-real-challenge/complete')
            .set(authorization(user));
        expect(response.status).toBe(400);
    });

    test('persists progress so it survives a refresh, and completing an already-done challenge again does not duplicate it', async () => {
        const user = await freshUser('instrument-progress@example.com');
        const complete = (challengeId) => request(app)
            .post(`/api/instrument-playground/challenges/${challengeId}/complete`)
            .set(authorization(user));

        await complete('three-notes');
        await complete('three-notes'); // repeat completion (e.g. re-triggered client-side) must not duplicate

        const progress = await request(app).get('/api/instrument-playground/challenges/progress').set(authorization(user));
        expect(progress.status).toBe(200);
        expect(progress.body.completedChallengeIds).toEqual(['three-notes']);
        expect(await InstrumentChallengeProgress.count({ where: { challengeId: 'three-notes', userId: user.id } })).toBe(1);
    });
});

describe('evaluateAndAward idempotency', () => {
    test('re-running evaluation for an already-earned badge does not create duplicates', async () => {
        const user = await freshUser('idempotent-badges@example.com');
        await user.update({ currentLoginStreak: 1 });
        await evaluateAndAward(user.id);
        await evaluateAndAward(user.id);
        expect(await Badge.count({ where: { name: 'Day One', userId: user.id } })).toBe(1);
    });
});
