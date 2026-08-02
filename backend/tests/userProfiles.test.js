const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'user-profiles.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    Badge, GameScore, Reflection, RhythmBeatmap, sequelize, Song, User, UserProfile,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
let listener;
let creator;
let leader;
let song;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    listener = await User.create({ email: 'listener-profile@example.com', name: 'Listener', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    creator = await User.create({
        creatorAccessStatus: 'SUSPENDED', email: 'creator-profile@example.com', name: 'Creator Account',
        passwordHash: hashPassword('password123'), role: 'CREATOR',
    });
    leader = await User.create({ email: 'leader-profile@example.com', name: 'Leader', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    song = await Song.create({ artist: 'Creator Account', creatorId: creator.id, status: 'PUBLISHED', title: 'Rhythm Song' });
    await RhythmBeatmap.create({
        difficulty: 'EASY', durationMs: 30000, generationSource: 'MANUAL',
        notes: [{ id: 'note-1', lane: 0, startMs: 1000, type: 'tap' }],
        songId: song.id, status: 'PUBLISHED', version: 1,
    });
    await Promise.all([
        GameScore.create({ accuracy: 90, rank: 'A', score: 1000, songId: song.id, userId: listener.id }),
        GameScore.create({ accuracy: 85, rank: 'A', score: 800, songId: song.id, userId: listener.id }),
        GameScore.create({ accuracy: 95, rank: 'S', score: 2000, songId: song.id, userId: leader.id }),
        GameScore.create({ accuracy: 96, rank: 'S', score: 2000, songId: song.id, userId: creator.id }),
        Badge.create({ description: 'First memory', name: 'Memory Keeper', userId: listener.id }),
        Reflection.create({ content: 'Public memory', displayMode: 'PROFILE', displayName: 'Listener', songId: song.id, status: 'APPROVED', userId: listener.id }),
        Reflection.create({ content: 'Anonymous memory', displayMode: 'ANONYMOUS', songId: song.id, status: 'APPROVED', userId: listener.id }),
        Reflection.create({ content: 'Pending memory', displayMode: 'PROFILE', displayName: 'Listener', songId: song.id, status: 'PENDING', userId: listener.id }),
    ]);
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('authenticated profile returns shared identity and official best leaderboard position', async () => {
    const response = await request(app).get('/api/users/me/profile').set(authorization(listener));
    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({ displayName: 'Listener', profileVisibility: 'PUBLIC', userId: listener.id });
    expect(response.body.rhythm).toMatchObject({ bestScore: 1000, gamesPlayed: 2, rank: 3 });
    expect(response.body.rhythm.bestLeaderboardRank).toMatchObject({
        difficulty: 'EASY', position: 3, score: 1000, songId: song.id,
    });
    expect(response.body.rhythm.recentScores).toHaveLength(2);
    expect(response.body.badges).toHaveLength(1);
    expect(response.body.reflections).toHaveLength(3);
});

test('creator with suspended creator access retains their normal user profile', async () => {
    const response = await request(app).get('/api/users/me/profile').set(authorization(creator));
    expect(response.status).toBe(200);
    expect(response.body.account).toMatchObject({ isCreator: true, role: 'CREATOR' });
});

test('owner updates shared identity and public activity obeys privacy preferences', async () => {
    const updated = await request(app).patch('/api/users/me/profile').set(authorization(listener)).send({
        bio: '  I collect music memories.  ', displayName: '  Melody Keeper  ', location: ' Singapore ',
        interestTags: ['National Day', 'Community Stories'],
        preferredLanguage: 'English', showBadges: false, showReflections: true,
        showRhythmRanking: false, theme: 'DARK',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.profile).toMatchObject({
        bio: 'I collect music memories.', displayName: 'Melody Keeper',
        interestTags: ['National Day', 'Community Stories'], theme: 'DARK',
    });
    expect((await User.findByPk(listener.id)).name).toBe('Melody Keeper');

    const publicResponse = await request(app).get(`/api/users/${listener.id}/profile`).set(authorization(leader));
    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.profile).toMatchObject({
        displayName: 'Melody Keeper', interestTags: ['National Day', 'Community Stories'], userId: listener.id,
    });
    expect(publicResponse.body.badges).toEqual([]);
    expect(publicResponse.body.rhythm).toBeNull();
    expect(publicResponse.body.reflections.map((reflection) => reflection.content)).toEqual(['Public memory']);
    expect(JSON.stringify(publicResponse.body)).not.toContain('Anonymous memory');
    expect(JSON.stringify(publicResponse.body)).not.toContain('Pending memory');
    expect(JSON.stringify(publicResponse.body)).not.toContain('listener-profile@example.com');
});

test('optional bio and canonical interest tags persist across profile reloads', async () => {
    const interestTags = [
        'National Day', 'Racial Harmony Day', 'Chinese Culture',
        'Malay Culture', 'Community Stories', 'Singapore History',
    ];
    const submittedTags = interestTags.map((tag, index) => index === 0 ? `  ${tag}  ` : tag);
    const updated = await request(app).patch('/api/users/me/profile').set(authorization(listener)).send({ bio: '   ', interestTags: submittedTags });
    const restored = await request(app).get('/api/users/me/profile').set(authorization(listener));
    const restoredSession = await request(app).get('/api/auth/me').set(authorization(listener));
    const login = await request(app).post('/api/auth/login').send({ email: listener.email, password: 'password123' });

    expect(updated.status).toBe(200);
    expect(updated.body.profile).toMatchObject({ bio: '', interestTags });
    expect(restored.status).toBe(200);
    expect(restored.body.profile).toMatchObject({ bio: '', interestTags });
    expect(restoredSession.status).toBe(200);
    expect(restoredSession.body.user.sharedProfile).toMatchObject({ bio: '', interestTags });
    expect(login.status).toBe(200);
    expect(login.body.user.sharedProfile).toMatchObject({ bio: '', interestTags });
    expect((await UserProfile.findByPk(listener.id)).interestTags).toEqual(interestTags);
});

test('profile rejects overlong bios and malformed interest selections', async () => {
    const cases = [
        { body: { bio: 'x'.repeat(501) }, message: /500 characters or fewer/i },
        { body: { interestTags: 'National Day' }, message: /must be an array/i },
        { body: { interestTags: ['National Day', 'Unknown Interest'] }, message: /not supported/i },
        { body: { interestTags: ['National Day', 'National Day'] }, message: /duplicates/i },
        { body: { interestTags: ['National Day', '  National Day  '] }, message: /duplicates/i },
        {
            body: { interestTags: ['National Day', 'Racial Harmony Day', 'Total Defence Day', 'Chinese Culture', 'Malay Culture', 'Indian Culture', 'Peranakan Heritage'] },
            message: /no more than 6/i,
        },
    ];

    for (const { body, message } of cases) {
        const response = await request(app).patch('/api/users/me/profile').set(authorization(listener)).send(body);
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(message);
    }
});

test('private profile is hidden from guests and other users but visible to its owner', async () => {
    await request(app).patch('/api/users/me/profile').set(authorization(listener)).send({ profileVisibility: 'PRIVATE' });
    const guest = await request(app).get(`/api/users/${listener.id}/profile`);
    const other = await request(app).get(`/api/users/${listener.id}/profile`).set(authorization(leader));
    const owner = await request(app).get(`/api/users/${listener.id}/profile`).set(authorization(listener));
    expect(guest.status).toBe(404);
    expect(other.status).toBe(404);
    expect(owner.status).toBe(200);
    expect(owner.body.isOwner).toBe(true);
});

test('profile updates reject unsupported, invalid, and unauthenticated changes', async () => {
    const unauthenticated = await request(app).patch('/api/users/me/profile').send({ displayName: 'No Access' });
    const invalid = await request(app).patch('/api/users/me/profile').set(authorization(listener)).send({ displayName: ' ' });
    const ownership = await request(app).patch('/api/users/me/profile').set(authorization(listener)).send({ userId: leader.id });
    const unsafeFile = await request(app).post('/api/users/me/profile/avatar').set(authorization(listener)).attach('avatar', Buffer.from('not an image'), 'avatar.txt');
    expect(unauthenticated.status).toBe(401);
    expect(invalid.status).toBe(400);
    expect(ownership.status).toBe(400);
    expect(unsafeFile.status).toBe(400);
    expect(await UserProfile.findByPk(leader.id)).toBeNull();
});
