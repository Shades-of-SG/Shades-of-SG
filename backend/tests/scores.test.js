/**
 * Owner: Ferlyn
 * Feature: Rhythm Game Scores
 */
const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'scores.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, GameScore, RhythmBeatmap, Song, User, UserProfile } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

let publishedSong;
let secondSong;
let draftSong;
let player;
let otherPlayer;
let thirdPlayer;
let privatePlayer;
let creator;

const validPayload = () => ({
    accuracy: 90, difficulty: 'medium', maxCombo: 8, rank: 'S',
    score: 8000, songId: publishedSong.id, totalNotes: 10,
});
const validClaimPayload = (overrides = {}) => ({
    ...validPayload(),
    badHits: 1,
    claimId: '11111111-1111-4111-8111-111111111111',
    earlyReleases: 0,
    goodHits: 1,
    greatHits: 2,
    holdCompletions: 0,
    misses: 0,
    perfectHits: 6,
    playedAt: new Date().toISOString(),
    ...overrides,
});
const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
const leaderboardUrl = (song = publishedSong, difficulty = 'MEDIUM', period = 'all-time') => (
    `/api/scores/leaderboard?songId=${song.id}&difficulty=${difficulty}&period=${period}`
);
const scoreFor = (user, overrides = {}) => GameScore.create({
    accuracy: 90,
    difficulty: 'MEDIUM',
    maxCombo: 8,
    rank: 'A',
    score: 8000,
    songId: publishedSong.id,
    userId: user.id,
    ...overrides,
});

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ email: 'score-creator@example.com', name: 'Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    player = await User.create({ email: 'player@example.com', name: 'Player', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    otherPlayer = await User.create({ email: 'other-player@example.com', name: 'Other', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    thirdPlayer = await User.create({ email: 'third-player@example.com', name: 'Third', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    privatePlayer = await User.create({ email: 'private-player@example.com', name: 'Private', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    await UserProfile.create({
        avatarUrl: 'https://example.com/player-avatar.jpg', displayName: 'Player Profile', userId: player.id,
    });
    await UserProfile.create({ displayName: 'Hidden Player', profileVisibility: 'PRIVATE', userId: privatePlayer.id });
    publishedSong = await Song.create({ creatorId: creator.id, status: 'PUBLISHED', title: 'Playable Song' });
    secondSong = await Song.create({ creatorId: creator.id, status: 'PUBLISHED', title: 'Second Song' });
    draftSong = await Song.create({ creatorId: creator.id, status: 'DRAFT', title: 'Private Song' });
    const notes = Array.from({ length: 10 }, (_, index) => ({ id: `note-${index}`, lane: index % 4, startMs: 1000 + (index * 500), type: 'tap' }));
    await Promise.all([
        RhythmBeatmap.create({ songId: publishedSong.id, difficulty: 'EASY', durationMs: 30000, generationSource: 'MANUAL', status: 'PUBLISHED', version: 1, notes }),
        RhythmBeatmap.create({ songId: publishedSong.id, difficulty: 'MEDIUM', durationMs: 30000, generationSource: 'MANUAL', status: 'PUBLISHED', version: 1, notes }),
        RhythmBeatmap.create({ songId: publishedSong.id, difficulty: 'HARD', durationMs: 30000, generationSource: 'MANUAL', status: 'PUBLISHED', version: 1, notes }),
        RhythmBeatmap.create({ songId: secondSong.id, difficulty: 'EASY', durationMs: 30000, generationSource: 'MANUAL', status: 'PUBLISHED', version: 1, notes }),
    ]);
});

beforeEach(async () => GameScore.destroy({ where: {} }));
afterAll(async () => { await sequelize.close(); if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath); });

test('guest gameplay creates no database score row', async () => {
    const response = await request(app).post('/api/scores').send(validPayload());
    expect(response.status).toBe(204);
    expect(await GameScore.count()).toBe(0);
});

test('authenticated registered score is saved for the JWT user and ignores supplied userId and rank', async () => {
    const response = await request(app).post('/api/scores').set(authorization(player)).send({
        ...validPayload(), userId: otherPlayer.id, rank: 'S',
    });
    expect(response.status).toBe(201);
    expect(response.body.score).toMatchObject({
        userId: player.id, songId: publishedSong.id, difficulty: 'MEDIUM', rank: 'A',
    });
    expect((await GameScore.findOne()).userId).toBe(player.id);
});

test('an authenticated guest claim is owned by the JWT user and remains idempotent on retry', async () => {
    const payload = validClaimPayload({ userId: otherPlayer.id });
    const first = await request(app).post('/api/scores').set(authorization(player)).send(payload);
    const retry = await request(app).post('/api/scores').set(authorization(player)).send(payload);

    expect(first.status).toBe(201);
    expect(first.body.score).toMatchObject({ claimId: payload.claimId, userId: player.id });
    expect(retry.status).toBe(200);
    expect(retry.body).toMatchObject({ alreadyClaimed: true, score: { userId: player.id } });
    expect(await GameScore.count({ where: { claimId: payload.claimId } })).toBe(1);
});

test('a claim ID cannot be attached to a second account', async () => {
    const payload = validClaimPayload();
    await request(app).post('/api/scores').set(authorization(player)).send(payload);
    const response = await request(app).post('/api/scores').set(authorization(otherPlayer)).send(payload);

    expect(response.status).toBe(409);
    expect(await GameScore.count({ where: { claimId: payload.claimId, userId: player.id } })).toBe(1);
    expect(await GameScore.count({ where: { userId: otherPlayer.id } })).toBe(0);
});

test('expired and internally inconsistent guest claims are rejected', async () => {
    const expired = await request(app).post('/api/scores').set(authorization(player)).send(validClaimPayload({
        playedAt: new Date(Date.now() - (61 * 60 * 1000)).toISOString(),
    }));
    const inconsistent = await request(app).post('/api/scores').set(authorization(player)).send(validClaimPayload({
        claimId: '22222222-2222-4222-8222-222222222222', perfectHits: 5,
    }));

    expect(expired.status).toBe(400);
    expect(expired.body.message).toMatch(/expired/i);
    expect(inconsistent.status).toBe(400);
    expect(inconsistent.body.message).toMatch(/hit counts/i);
    expect(await GameScore.count()).toBe(0);
});

test('creator token retains normal registered-user rhythm access', async () => {
    const response = await request(app).post('/api/scores').set(authorization(creator)).send(validPayload());
    expect(response.status).toBe(201);
    expect(response.body.score).toMatchObject({ userId: creator.id, songId: publishedSong.id });
    expect(await GameScore.count()).toBe(1);
});

test('my scores returns recent attempts and the personal best for each song and difficulty', async () => {
    await Promise.all([
        scoreFor(player, { difficulty: 'EASY', score: 7000 }),
        scoreFor(player, { difficulty: 'EASY', score: 9000 }),
        scoreFor(player, { difficulty: 'MEDIUM', score: 8000 }),
        scoreFor(otherPlayer, { difficulty: 'EASY', score: 12000 }),
    ]);

    const response = await request(app).get('/api/scores/mine').set(authorization(player));

    expect(response.status).toBe(200);
    expect(response.body.scores).toHaveLength(3);
    expect(response.body.bestScores).toHaveLength(2);
    expect(response.body.bestScores).toEqual(expect.arrayContaining([
        expect.objectContaining({ difficulty: 'EASY', score: 9000, songId: publishedSong.id }),
        expect.objectContaining({ difficulty: 'MEDIUM', score: 8000, songId: publishedSong.id }),
    ]));
});

test('a completed run persists and updates own profile, public profile, and leaderboard data', async () => {
    const saved = await request(app).post('/api/scores').set(authorization(player)).send(validPayload());
    expect(saved.status).toBe(201);
    expect(await GameScore.count({ where: { userId: player.id } })).toBe(1);

    const ownProfile = await request(app).get('/api/users/me/profile').set(authorization(player));
    expect(ownProfile.status).toBe(200);
    expect(ownProfile.body.rhythm).toMatchObject({ bestScore: 8000, gamesPlayed: 1, rank: 1 });
    expect(ownProfile.body.rhythm.bestLeaderboardRank).toMatchObject({ difficulty: 'MEDIUM', position: 1, songId: publishedSong.id });
    expect(ownProfile.body.rhythm.topScores[0]).toMatchObject({ score: 8000, songId: publishedSong.id });

    const publicProfile = await request(app).get(`/api/users/${player.id}/profile`).set(authorization(otherPlayer));
    expect(publicProfile.status).toBe(200);
    expect(publicProfile.body.rhythm).toMatchObject({ bestScore: 8000, gamesPlayed: 1, rank: 1 });
    expect(publicProfile.body.rhythm.topScores[0]).toMatchObject({ score: 8000, songId: publishedSong.id });

    const leaderboard = await request(app).get(`/api/scores/leaderboard?songId=${publishedSong.id}&difficulty=MEDIUM&period=all-time`);
    expect(leaderboard.status).toBe(200);
    expect(leaderboard.body.entries[0]).toMatchObject({ position: 1, score: 8000, userId: player.id });
});

test('draft song score submission is rejected', async () => {
    const response = await request(app).post('/api/scores').set(authorization(player)).send({ ...validPayload(), songId: draftSong.id });
    expect(response.status).toBe(404);
    expect(await GameScore.count()).toBe(0);
});

test('leaderboard returns ranked best scores with profile identity and excludes draft songs', async () => {
    await Promise.all([
        GameScore.create({ accuracy: 90, difficulty: 'MEDIUM', rank: 'A', score: 8000, songId: publishedSong.id, userId: player.id }),
        GameScore.create({ accuracy: 80, difficulty: 'MEDIUM', rank: 'B', score: 7000, songId: publishedSong.id, userId: player.id }),
        GameScore.create({ accuracy: 95, difficulty: 'MEDIUM', rank: 'S', score: 9000, songId: publishedSong.id, userId: otherPlayer.id }),
        GameScore.create({ accuracy: 99, difficulty: 'MEDIUM', rank: 'S', score: 10000, songId: draftSong.id, userId: player.id }),
    ]);

    const response = await request(app).get(`/api/scores/leaderboard?songId=${publishedSong.id}&difficulty=MEDIUM&period=all-time`).set(authorization(player));

    expect(response.status).toBe(200);
    expect(response.body.entries).toHaveLength(2);
    expect(response.body.entries[0]).toMatchObject({ displayName: 'Other', position: 1, score: 9000 });
    expect(response.body.entries[1]).toMatchObject({
        avatarUrl: 'https://example.com/player-avatar.jpg', displayName: 'Player Profile',
        position: 2, score: 8000, songId: publishedSong.id, userId: player.id,
    });
    expect(response.body.currentUser).toMatchObject({ position: 2, score: 8000, userId: player.id });
    expect(response.body.totalRankedPlayers).toBe(2);
    expect(response.body.selectedSong).toMatchObject({ id: publishedSong.id, title: 'Playable Song' });
    expect(response.body.availableDifficulties).toEqual(['EASY', 'MEDIUM', 'HARD']);
});

test('leaderboard filters by song and difficulty without comparing scores across charts', async () => {
    await Promise.all([
        scoreFor(player, { score: 8100 }),
        scoreFor(player, { score: 7900 }),
        scoreFor(otherPlayer, { score: 9000 }),
        scoreFor(creator, { difficulty: 'EASY', score: 20000 }),
        scoreFor(thirdPlayer, { difficulty: 'EASY', score: 50000, songId: secondSong.id }),
    ]);

    const medium = await request(app).get(leaderboardUrl());
    expect(medium.status).toBe(200);
    expect(medium.body.entries.map(({ score, userId }) => ({ score, userId }))).toEqual([
        { score: 9000, userId: otherPlayer.id },
        { score: 8100, userId: player.id },
    ]);

    const easy = await request(app).get(leaderboardUrl(publishedSong, 'EASY'));
    expect(easy.status).toBe(200);
    expect(easy.body.entries).toHaveLength(1);
    expect(easy.body.entries[0]).toMatchObject({ difficulty: 'EASY', score: 20000, userId: creator.id });

    const secondSongEasy = await request(app).get(leaderboardUrl(secondSong, 'EASY'));
    expect(secondSongEasy.status).toBe(200);
    expect(secondSongEasy.body.entries).toHaveLength(1);
    expect(secondSongEasy.body.entries[0]).toMatchObject({ score: 50000, songId: secondSong.id, userId: thirdPlayer.id });
});

test('weekly and monthly leaderboards use only scores achieved within their time windows', async () => {
    const now = Date.now();
    await Promise.all([
        scoreFor(player, { createdAt: new Date(now - (2 * 24 * 60 * 60 * 1000)), difficulty: 'EASY', score: 7000 }),
        scoreFor(otherPlayer, { createdAt: new Date(now - (10 * 24 * 60 * 60 * 1000)), difficulty: 'EASY', score: 8000 }),
        scoreFor(thirdPlayer, { createdAt: new Date(now - (40 * 24 * 60 * 60 * 1000)), difficulty: 'EASY', score: 9000 }),
    ]);

    const weekly = await request(app).get(leaderboardUrl(publishedSong, 'EASY', 'weekly'));
    expect(weekly.status).toBe(200);
    expect(weekly.body.entries.map((entry) => entry.userId)).toEqual([player.id]);

    const monthly = await request(app).get(leaderboardUrl(publishedSong, 'EASY', 'monthly'));
    expect(monthly.status).toBe(200);
    expect(monthly.body.entries.map((entry) => entry.userId)).toEqual([otherPlayer.id, player.id]);

    const allTime = await request(app).get(leaderboardUrl(publishedSong, 'EASY'));
    expect(allTime.body.entries.map((entry) => entry.userId)).toEqual([thirdPlayer.id, otherPlayer.id, player.id]);
});

test('ranking tie-breaks by score, accuracy, achievement time, then score id', async () => {
    const earlier = new Date('2026-01-02T00:00:00.000Z');
    const later = new Date('2026-01-03T00:00:00.000Z');
    await Promise.all([
        scoreFor(player, { accuracy: 90, createdAt: earlier, difficulty: 'HARD', id: '00000000-0000-4000-8000-000000000004', score: 9000 }),
        scoreFor(otherPlayer, { accuracy: 95, createdAt: later, difficulty: 'HARD', id: '00000000-0000-4000-8000-000000000003', score: 9000 }),
        scoreFor(creator, { accuracy: 95, createdAt: earlier, difficulty: 'HARD', id: '00000000-0000-4000-8000-000000000002', score: 9000 }),
        scoreFor(thirdPlayer, { accuracy: 95, createdAt: earlier, difficulty: 'HARD', id: '00000000-0000-4000-8000-000000000001', score: 9000 }),
    ]);

    const response = await request(app).get(leaderboardUrl(publishedSong, 'HARD'));
    expect(response.status).toBe(200);
    expect(response.body.entries.map((entry) => entry.userId)).toEqual([
        thirdPlayer.id, creator.id, otherPlayer.id, player.id,
    ]);
    expect(response.body.entries.map((entry) => entry.position)).toEqual([1, 2, 3, 4]);
});

test('current-user rank and total player count come from the filtered backend ranking', async () => {
    await Promise.all([
        scoreFor(player, { difficulty: 'EASY', score: 8000 }),
        scoreFor(otherPlayer, { difficulty: 'EASY', score: 9000 }),
        scoreFor(thirdPlayer, { difficulty: 'EASY', score: 7000 }),
    ]);

    const response = await request(app).get(leaderboardUrl(publishedSong, 'EASY')).set(authorization(player));
    expect(response.status).toBe(200);
    expect(response.body.totalRankedPlayers).toBe(3);
    expect(response.body.currentUser).toMatchObject({ position: 2, score: 8000, userId: player.id });
});

test('user summary reports the best leaderboard position across all song and difficulty charts', async () => {
    await Promise.all([
        scoreFor(player, { score: 8000 }),
        scoreFor(otherPlayer, { score: 9000 }),
        scoreFor(player, { accuracy: 96, difficulty: 'EASY', score: 100, songId: secondSong.id }),
        scoreFor(otherPlayer, { difficulty: 'EASY', score: 90, songId: secondSong.id }),
    ]);

    const response = await request(app).get(`/api/scores/user/${player.id}/summary`).set(authorization(otherPlayer));
    expect(response.status).toBe(200);
    expect(response.body.summary).toMatchObject({ bestScore: 8000, gamesCompleted: 2, rank: 1 });
    expect(response.body.summary.bestLeaderboardRank).toMatchObject({
        accuracy: 96,
        difficulty: 'EASY',
        position: 1,
        score: 100,
        songId: secondSong.id,
        songTitle: 'Second Song',
        totalRankedPlayers: 2,
    });
});

test('user summary returns the three highest chart personal bests in descending order', async () => {
    await Promise.all([
        scoreFor(player, { difficulty: 'EASY', score: 7000 }),
        scoreFor(player, { difficulty: 'EASY', score: 6000 }),
        scoreFor(player, { difficulty: 'MEDIUM', score: 9000 }),
        scoreFor(player, { difficulty: 'HARD', score: 8000 }),
        scoreFor(player, { difficulty: 'EASY', score: 10000, songId: secondSong.id }),
        scoreFor(otherPlayer, { difficulty: 'MEDIUM', score: 14000 }),
    ]);

    const response = await request(app).get(`/api/scores/user/${player.id}/summary`).set(authorization(player));

    expect(response.status).toBe(200);
    expect(response.body.summary.topScores).toHaveLength(3);
    expect(response.body.summary.topScores.map((entry) => entry.score)).toEqual([10000, 9000, 8000]);
    expect(response.body.summary.topScores.every((entry) => entry.song && entry.difficulty && entry.rank)).toBe(true);
    expect(response.body.summary.topScores).not.toEqual(expect.arrayContaining([
        expect.objectContaining({ score: 14000 }),
        expect.objectContaining({ score: 7000 }),
    ]));
});

test('leaderboard returns clear empty and unavailable-difficulty states', async () => {
    const empty = await request(app).get(leaderboardUrl(publishedSong, 'HARD'));
    expect(empty.status).toBe(200);
    expect(empty.body).toMatchObject({ currentUser: null, difficultyAvailable: true, entries: [], totalRankedPlayers: 0 });

    const unavailable = await request(app).get(leaderboardUrl(secondSong, 'HARD'));
    expect(unavailable.status).toBe(200);
    expect(unavailable.body).toMatchObject({ difficultyAvailable: false, entries: [], selectedDifficulty: 'HARD' });
    expect(unavailable.body.availableDifficulties).toEqual(['EASY']);
});

test('leaderboard validates query parameters and reports an unknown published song', async () => {
    const expiredSession = await request(app).get(leaderboardUrl(publishedSong, 'EASY')).set('Authorization', 'Bearer invalid-token');
    expect(expiredSession.status).toBe(401);
    const invalidSong = await request(app).get('/api/scores/leaderboard?songId=not-a-uuid&difficulty=EASY&period=all-time');
    expect(invalidSong.status).toBe(400);
    const invalidDifficulty = await request(app).get(`/api/scores/leaderboard?songId=${publishedSong.id}&difficulty=EXPERT&period=all-time`);
    expect(invalidDifficulty.status).toBe(400);
    const invalidPeriod = await request(app).get(`/api/scores/leaderboard?songId=${publishedSong.id}&difficulty=EASY&period=yearly`);
    expect(invalidPeriod.status).toBe(400);
    const unknownSong = await request(app).get('/api/scores/leaderboard?songId=00000000-0000-4000-8000-000000000099&difficulty=EASY&period=all-time');
    expect(unknownSong.status).toBe(404);
    const invalidUser = await request(app).get('/api/scores/user/not-a-uuid/summary');
    expect(invalidUser.status).toBe(400);
});

test('private leaderboard identities are anonymous to others but visible to the signed-in owner', async () => {
    await scoreFor(privatePlayer, { difficulty: 'EASY', score: 9000 });

    const publicResponse = await request(app).get(leaderboardUrl(publishedSong, 'EASY'));
    expect(publicResponse.body.entries[0]).toMatchObject({ avatarUrl: null, displayName: 'Anonymous Player', userId: null });
    expect(publicResponse.body.entries[0]).not.toHaveProperty('email');

    const ownerResponse = await request(app).get(leaderboardUrl(publishedSong, 'EASY')).set(authorization(privatePlayer));
    expect(ownerResponse.body.entries[0]).toMatchObject({ displayName: 'Hidden Player', isCurrentUser: true, userId: privatePlayer.id });

    const hiddenSummary = await request(app).get(`/api/scores/user/${privatePlayer.id}/summary`).set(authorization(player));
    expect(hiddenSummary.status).toBe(404);
    const ownerSummary = await request(app).get(`/api/scores/user/${privatePlayer.id}/summary`).set(authorization(privatePlayer));
    expect(ownerSummary.status).toBe(200);
    expect(ownerSummary.body.summary.bestLeaderboardRank).toMatchObject({ position: 1, songId: publishedSong.id });
});

test.each([
    [{ score: -1 }, 'score must be a non-negative integer'],
    [{ accuracy: 101 }, 'accuracy must be between 0 and 100'],
    [{ difficulty: 'impossible' }, 'difficulty must be EASY, MEDIUM, or HARD'],
    [{ totalNotes: 0 }, 'totalNotes must be an integer between 1 and 10000'],
    [{ maxCombo: 11 }, 'maxCombo must be between 0 and totalNotes'],
    [{ score: 999999 }, 'score exceeds the maximum possible value for this chart'],
])('invalid score values are rejected: %o', async (override, message) => {
    const response = await request(app).post('/api/scores').set(authorization(player)).send({ ...validPayload(), ...override });
    expect(response.status).toBe(400);
    expect(response.body.message).toBe(message);
    expect(await GameScore.count()).toBe(0);
});
