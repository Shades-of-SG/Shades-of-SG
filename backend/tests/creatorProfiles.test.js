const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'creator-profiles.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    CreatorProfile, Folder, Reflection, sequelize, Song, SongFolder, User, UserProfile,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

const authorization = (user) => ({ Authorization: `Bearer ${createToken(user)}` });
let creator;
let privateCreator;
let registered;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    creator = await User.create({ email: 'creator@example.com', name: 'Account Name', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    privateCreator = await User.create({ email: 'private@example.com', name: 'Private Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' });
    registered = await User.create({ email: 'listener@example.com', name: 'Listener', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    await UserProfile.create({ displayName: 'Violet', userId: creator.id });
    await UserProfile.create({ displayName: 'Hidden', userId: privateCreator.id });
    await CreatorProfile.create({
        bio: 'Public biography', contentFocus: ['Heritage'],
        languages: ['English'], showCommunityReflections: true, userId: creator.id,
    });
    await CreatorProfile.create({ socialLinks: { website: 'https://private.example' }, userId: privateCreator.id, visibility: 'PRIVATE' });

    const published = await Song.create({ artist: 'Violet', creatorId: creator.id, status: 'PUBLISHED', title: 'Public Song' });
    await Song.create({ artist: 'Violet', creatorId: creator.id, status: 'DRAFT', title: 'Secret Draft' });
    await Song.create({ artist: 'Hidden', creatorId: privateCreator.id, status: 'PUBLISHED', title: 'Other Song' });
    const folder = await Folder.create({ createdBy: creator.id, name: 'Public Collection', slug: 'public-collection', status: 'APPROVED' });
    await SongFolder.create({ addedBy: creator.id, folderId: folder.id, songId: published.id });
    await Reflection.create({ content: 'A public memory', displayMode: 'PROFILE', displayName: 'Mei', songId: published.id, status: 'APPROVED' });
    await Reflection.create({ content: 'Pending moderation', displayMode: 'PROFILE', displayName: 'Mei', songId: published.id, status: 'PENDING' });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('public creator profile returns only public-safe, published creator data', async () => {
    const response = await request(app).get(`/api/creators/${creator.id}/profile`);

    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({ creatorId: creator.id, displayName: 'Violet' });
    expect(response.body.songs.map((song) => song.title)).toEqual(['Public Song']);
    expect(response.body.collections).toHaveLength(1);
    expect(response.body.collections[0].songs.map((song) => song.title)).toEqual(['Public Song']);
    expect(response.body.reflections.map((reflection) => reflection.content)).toEqual(['A public memory']);
    expect(response.body.stats).toMatchObject({ publishedCollections: 1, publishedSongs: 1 });
    expect(JSON.stringify(response.body)).not.toContain('creator@example.com');
    expect(JSON.stringify(response.body)).not.toContain('Secret Draft');
    expect(JSON.stringify(response.body)).not.toContain('Pending moderation');
    expect(response.body.profile.visibility).toBeUndefined();
});

test('private profile is hidden from guests and other users but visible to its owner', async () => {
    const guest = await request(app).get(`/api/creators/${privateCreator.id}/profile`);
    const otherUser = await request(app).get(`/api/creators/${privateCreator.id}/profile`).set(authorization(creator));
    const owner = await request(app).get(`/api/creators/${privateCreator.id}/profile`).set(authorization(privateCreator));

    expect(guest.status).toBe(404);
    expect(JSON.stringify(guest.body)).not.toContain('private.example');
    expect(otherUser.status).toBe(404);
    expect(owner.status).toBe(200);
    expect(owner.body.isOwner).toBe(true);
});

test('creator can update only their own editable profile fields', async () => {
    const response = await request(app)
        .patch('/api/creators/me/profile')
        .set(authorization(creator))
        .send({
            displayName: 'Updated Violet', languages: ['English', 'Malay'],
            showCommunityReflections: false, socialLinks: { website: 'https://example.com' },
            tagline: 'A new public introduction.', visibility: 'PUBLIC',
        });

    expect(response.status).toBe(200);
    expect(response.body.profile).toMatchObject({ displayName: 'Updated Violet', showCommunityReflections: false });
    expect((await UserProfile.findByPk(creator.id)).displayName).toBe('Updated Violet');
    expect((await UserProfile.findByPk(privateCreator.id)).displayName).toBe('Hidden');
    const publicResponse = await request(app).get(`/api/creators/${creator.id}/profile`);
    expect(publicResponse.body.reflections).toEqual([]);
});

test('profile update rejects unauthenticated, non-creator, and invalid input', async () => {
    const unauthenticated = await request(app).patch('/api/creators/me/profile').send({ displayName: 'No access' });
    const listener = await request(app).patch('/api/creators/me/profile').set(authorization(registered)).send({ displayName: 'No access' });
    const invalid = await request(app).patch('/api/creators/me/profile').set(authorization(creator)).send({ displayName: 'Valid Name', socialLinks: { website: 'javascript:alert(1)' } });

    expect(unauthenticated.status).toBe(401);
    expect(listener.status).toBe(403);
    expect(invalid.status).toBe(400);
});

test('social links are trimmed, placeholders are omitted, and public-safe links are returned', async () => {
    const response = await request(app)
        .patch('/api/creators/me/profile')
        .set(authorization(creator))
        .send({ socialLinks: {
            instagram: '  https://instagram.com/violet  ',
            tiktok: 'http://',
            website: 'https://',
            youtube: 'https://youtube.com/@violet',
        } });

    expect(response.status).toBe(200);
    expect(response.body.profile.socialLinks).toEqual({
        instagram: 'https://instagram.com/violet',
        youtube: 'https://youtube.com/@violet',
    });
    const publicResponse = await request(app).get(`/api/creators/${creator.id}/profile`);
    expect(publicResponse.body.profile.socialLinks).toEqual(response.body.profile.socialLinks);
});
