/**
 * Owner: Ferlyn
 * Feature: Reflection Wall & Moderation
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

process.env.DATABASE_URL = '';
const testDatabasePath = path.join(__dirname, 'reflections.test.sqlite');
process.env.DB_STORAGE = testDatabasePath;

const request = require('supertest');
const { Op } = require('sequelize');
const app = require('../server');
const {
    sequelize, GuestLikeSession, GuestReflectionLike, ModerationAction, Reflection, ReflectionComment, ReflectionCommentLike, ReflectionCommentReport,
    ReflectionLike, Song, User, UserProfile, UserWarning,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');
const { resetRateLimitsForTests } = require('../middleware/rateLimit');
const { GUEST_LIKE_COOKIE } = require('../services/guestLikeService');

const SINGAPORE_OFFSET_MS = 8 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let creator;
let creatorToken;
let owner;
let ownerToken;
let otherOwner;
let otherOwnerToken;
let admin;
let adminToken;
let otherCreator;
let otherCreatorToken;
let song;
let otherCreatorSong;
let secondSong;
let draftSong;

function singaporeDayStart(daysFromToday = 0) {
    const now = new Date();
    const singaporeNow = new Date(now.getTime() + SINGAPORE_OFFSET_MS);
    return new Date(
        Date.UTC(
            singaporeNow.getUTCFullYear(),
            singaporeNow.getUTCMonth(),
            singaporeNow.getUTCDate()
        ) - SINGAPORE_OFFSET_MS + (daysFromToday * ONE_DAY_MS)
    );
}

async function createStoredReflection(overrides = {}) {
    return Reflection.create({
        content: 'A stored memory.',
        displayMode: 'ANONYMOUS',
        displayName: null,
        guestSubmission: true,
        songId: song.id,
        status: 'PENDING',
        tags: [],
        userId: null,
        ...overrides,
    });
}

beforeAll(async () => {
    await sequelize.sync({ force: true });
    owner = await User.create({
        email: 'reflection-owner@example.com',
        name: 'Memory Keeper',
        passwordHash: hashPassword('password123'),
    });
    creator = await User.create({
        email: 'Rose@example.com',
        name: 'Rose',
        passwordHash: hashPassword('password123'),
        role: 'CREATOR',
    });
    otherOwner = await User.create({
        email: 'other-reflection-owner@example.com', name: 'Other Keeper',
        passwordHash: hashPassword('password123'),
    });
    admin = await User.create({
        email: 'reflection-admin@example.com', name: 'Wall Admin',
        passwordHash: hashPassword('password123'), role: 'ADMIN',
    });
    otherCreator = await User.create({
        email: 'other-creator@example.com', name: 'Other Creator',
        passwordHash: hashPassword('password123'), role: 'CREATOR',
    });
    await UserProfile.bulkCreate([
        { avatarUrl: 'https://images.example/owner.jpg', displayName: 'Memory Keeper', userId: owner.id },
        { avatarUrl: 'https://images.example/other.jpg', displayName: 'Other Keeper', userId: otherOwner.id },
    ]);
    song = await Song.create({ creatorId: creator.id, title: 'Test Song', status: 'PUBLISHED' });
    secondSong = await Song.create({ creatorId: creator.id, title: 'Second Song', status: 'PUBLISHED' });
    draftSong = await Song.create({ creatorId: creator.id, title: 'Draft Song', status: 'DRAFT' });
    otherCreatorSong = await Song.create({ creatorId: otherCreator.id, title: 'Other Creator Song', status: 'PUBLISHED' });
    ownerToken = createToken(owner);
    creatorToken = createToken(creator);
    otherOwnerToken = createToken(otherOwner);
    adminToken = createToken(admin);
    otherCreatorToken = createToken(otherCreator);
});

beforeEach(async () => {
    resetRateLimitsForTests();
    await Reflection.destroy({ where: {} });
    await GuestLikeSession.destroy({ where: {} });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(testDatabasePath)) fs.unlinkSync(testDatabasePath);
});

test('reflection owner can create, read, update, and delete a reflection', async () => {
    const created = await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
            content: 'A memory of home.',
            isAnonymous: false,
            songId: song.id,
            tags: [' family ', 'FAMILY', 'Home', 'unknown'],
        });

    expect(created.status).toBe(201);
    expect(created.body.reflection).toMatchObject({
        content: 'A memory of home.',
        displayName: 'Memory Keeper',
        guestSubmission: false,
        isOwner: true,
        song: { title: 'Test Song' },
        tags: ['Family', 'Home'],
        status: 'PENDING',
    });

    const id = created.body.reflection.id;
    const listed = await request(app).get('/api/reflections');
    expect(listed.status).toBe(200);
    expect(listed.body.reflections).toHaveLength(0);

    const updated = await request(app)
        .put(`/api/reflections/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'An updated memory.', isAnonymous: true, songId: song.id });
    expect(updated.status).toBe(200);
    expect(updated.body.reflection).toMatchObject({
        content: 'An updated memory.',
        isAnonymous: true,
        tags: ['Family', 'Home'],
    });

    const deleted = await request(app)
        .delete(`/api/reflections/${id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(deleted.status).toBe(204);
});

test('a guest can submit an anonymous reflection for moderation', async () => {
    const response = await request(app)
        .post('/api/reflections')
        .send({ content: 'A memory.', songId: song.id, memoryTypes: ['nostalgia'] });

    expect(response.status).toBe(201);
    expect(response.body.reflection).toMatchObject({
        displayName: 'Anonymous',
        displayMode: 'ANONYMOUS',
        guestSubmission: true,
        isAnonymous: true,
        isOwner: false,
        status: 'PENDING',
        tags: ['Nostalgia'],
    });

    const listed = await request(app).get('/api/reflections');
    expect(listed.body.reflections).toHaveLength(0);
});

test('moderation endpoints require a current creator account', async () => {
    const reflection = await createStoredReflection();

    const unauthenticated = await request(app).get('/api/reflections/moderation');
    expect(unauthenticated.status).toBe(401);

    const registered = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(registered.status).toBe(403);

    const registeredUpdate = await request(app)
        .put(`/api/reflections/${reflection.id}/moderation`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'APPROVED' });
    expect(registeredUpdate.status).toBe(403);
    await reflection.reload();
    expect(reflection.status).toBe('PENDING');
});

test('creator moderation list combines filters, paginates, searches all supported fields, and returns global counts', async () => {
    const startToday = singaporeDayStart();
    const todayFirst = new Date(startToday.getTime() + (60 * 60 * 1000));
    const todaySecond = new Date(startToday.getTime() + (2 * 60 * 60 * 1000));
    const yesterday = new Date(startToday.getTime() - ONE_DAY_MS + (60 * 60 * 1000));
    const twoDaysAgo = new Date(startToday.getTime() - (2 * ONE_DAY_MS) + (60 * 60 * 1000));

    const anonymousFamily = await createStoredReflection({
        content: 'Rain at the parade.',
        createdAt: todaySecond,
        tags: ['Family'],
    });
    const profileReflection = await createStoredReflection({
        content: 'A classroom memory.',
        createdAt: todayFirst,
        displayMode: 'PROFILE',
        displayName: 'Memory Keeper',
        guestSubmission: false,
        songId: secondSong.id,
        tags: ['School'],
        userId: owner.id,
    });
    await createStoredReflection({ createdAt: yesterday, status: 'APPROVED' });
    await createStoredReflection({ createdAt: twoDaysAgo, status: 'FLAGGED' });

    const paged = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${creatorToken}`)
        .query({ status: 'PENDING', page: 2, limit: 1 });

    expect(paged.status).toBe(200);
    expect(paged.body.pagination).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(paged.body.reflections).toHaveLength(1);
    expect(paged.body.stats).toEqual({
        pending: 2,
        approved: 1,
        flagged: 1,
        rejected: 0,
        newToday: 2,
        newYesterday: 1,
    });

    const combined = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${creatorToken}`)
        .query({
            status: 'PENDING',
            search: 'family',
            songId: song.id,
            dateFrom: startToday.toISOString(),
            anonymousOnly: 'true',
        });

    expect(combined.status).toBe(200);
    expect(combined.body.reflections.map((item) => item.id)).toEqual([anonymousFamily.id]);
    expect(combined.body.reflections[0]).toMatchObject({
        guestSubmission: true,
        submissionType: 'GUEST',
        tags: ['Family'],
    });

    const [contentSearch, authorSearch, songSearch] = await Promise.all([
        request(app)
            .get('/api/reflections/moderation')
            .set('Authorization', `Bearer ${creatorToken}`)
            .query({ status: 'PENDING', search: 'parade' }),
        request(app)
            .get('/api/reflections/moderation')
            .set('Authorization', `Bearer ${creatorToken}`)
            .query({ status: 'PENDING', search: 'Memory Keeper' }),
        request(app)
            .get('/api/reflections/moderation')
            .set('Authorization', `Bearer ${creatorToken}`)
            .query({ status: 'PENDING', search: 'Second Song' }),
    ]);

    expect(contentSearch.body.reflections.map((item) => item.id)).toEqual([anonymousFamily.id]);
    expect(authorSearch.body.reflections.map((item) => item.id)).toEqual([profileReflection.id]);
    expect(songSearch.body.reflections.map((item) => item.id)).toEqual([profileReflection.id]);

    const capped = await request(app)
        .get('/api/reflections/moderation')
        .set('Authorization', `Bearer ${creatorToken}`)
        .query({ limit: 100 });
    expect(capped.body.pagination.limit).toBe(24);
});

test('creator can approve a guest reflection, save a moderator note, and make it publicly visible', async () => {
    const submitted = await request(app)
        .post('/api/reflections')
        .send({ content: 'A pending memory.', songId: song.id });
    const id = submitted.body.reflection.id;

    const approved = await request(app)
        .put(`/api/reflections/${id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'APPROVED', moderatorNote: 'Suitable for the wall.' });

    expect(approved.status).toBe(200);
    expect(approved.body.reflection).toMatchObject({
        id,
        status: 'APPROVED',
        moderatorNote: 'Suitable for the wall.',
        moderatedBy: creator.id,
        moderator: { id: creator.id, name: 'Rose' },
    });
    expect(approved.body.reflection.moderatedAt).toBeTruthy();

    const publiclyListed = await request(app).get('/api/reflections');
    expect(publiclyListed.body.reflections).toHaveLength(1);
    expect(publiclyListed.body.reflections[0].id).toBe(id);
    expect(publiclyListed.body.reflections[0]).not.toHaveProperty('guestSubmission');

    const tooLong = await request(app)
        .put(`/api/reflections/${id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'FLAGGED', moderatorNote: 'x'.repeat(1001) });
    expect(tooLong.status).toBe(400);

    const unchanged = await Reflection.findByPk(id);
    expect(unchanged.status).toBe('APPROVED');
    expect(unchanged.moderatorNote).toBe('Suitable for the wall.');
});

test('flagging an approved reflection immediately hides it from the public API', async () => {
    const submitted = await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ content: 'A visible memory.', songId: song.id });
    const id = submitted.body.reflection.id;

    await Reflection.update({ status: 'APPROVED' }, { where: { id } });

    expect((await request(app).get('/api/reflections')).body.reflections).toHaveLength(1);

    const flagged = await request(app)
        .put(`/api/reflections/${id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ status: 'FLAGGED' });
    expect(flagged.status).toBe(200);
    expect(flagged.body.reflection.status).toBe('FLAGGED');

    expect((await request(app).get('/api/reflections')).body.reflections).toHaveLength(0);
});

test('creator can remove an owned-song reflection from public view while a regular non-owner cannot', async () => {
    const reflection = await createStoredReflection();

    const forbidden = await request(app)
        .delete(`/api/reflections/${reflection.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(forbidden.status).toBe(403);
    expect(await Reflection.findByPk(reflection.id)).not.toBeNull();

    const deleted = await request(app)
        .delete(`/api/reflections/${reflection.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);
    expect(deleted.status).toBe(204);
    expect(await Reflection.findByPk(reflection.id)).toMatchObject({ status: 'REJECTED' });
});

test('public reflection API excludes both pending and flagged submissions', async () => {
    await createStoredReflection({ content: 'Pending' });
    await createStoredReflection({ content: 'Flagged', status: 'FLAGGED' });
    const approved = await createStoredReflection({ content: 'Approved', status: 'APPROVED' });

    const response = await request(app).get('/api/reflections');
    expect(response.status).toBe(200);
    expect(response.body.reflections.map((item) => item.id)).toEqual([approved.id]);
});

test('guest anonymous submission cannot spoof user identity or self-approve', async () => {
    const response = await request(app).post('/api/reflections').send({
        content: 'Guest memory', displayName: 'Spoofed Name', isAnonymous: true,
        songId: song.id, status: 'APPROVED', userId: owner.id,
    });
    expect(response.status).toBe(201);
    expect(response.body.reflection).toMatchObject({ displayName: 'Anonymous', guestSubmission: true, status: 'PENDING' });
    const stored = await Reflection.findByPk(response.body.reflection.id);
    expect(stored.userId).toBeNull();
    expect(stored.displayName).toBeNull();
    expect(stored.status).toBe('PENDING');
});

test('registered named and anonymous submissions derive identity from JWT', async () => {
    const named = await request(app).post('/api/reflections').set('Authorization', `Bearer ${ownerToken}`).send({
        content: 'Named memory', displayName: 'Spoofed', songId: song.id, userId: otherOwner.id,
    });
    expect(named.status).toBe(201);
    expect(named.body.reflection).toMatchObject({ displayName: 'Memory Keeper', isAnonymous: false, status: 'PENDING' });
    expect(named.body.reflection).not.toHaveProperty('userId');
    const namedStored = await Reflection.findByPk(named.body.reflection.id);
    expect(namedStored.userId).toBe(owner.id);

    const anonymous = await request(app).post('/api/reflections').set('Authorization', `Bearer ${ownerToken}`).send({
        content: 'Hidden identity', isAnonymous: true, songId: song.id,
    });
    expect(anonymous.body.reflection).toMatchObject({ displayName: 'Anonymous', isAnonymous: true, status: 'PENDING' });
    expect(anonymous.body.reflection).not.toHaveProperty('userId');
    expect((await Reflection.findByPk(anonymous.body.reflection.id)).userId).toBe(owner.id);
});

test('missing, unknown, malformed, and unpublished Songs are rejected for reflection submission', async () => {
    const missing = await request(app).post('/api/reflections').send({ content: 'Memory' });
    const malformed = await request(app).post('/api/reflections').send({ content: 'Memory', songId: 'bad-id' });
    const unknown = await request(app).post('/api/reflections').send({ content: 'Memory', songId: '11111111-1111-4111-8111-111111111111' });
    const draft = await request(app).post('/api/reflections').send({ content: 'Memory', songId: draftSong.id });
    expect([missing.status, malformed.status, unknown.status, draft.status]).toEqual([400, 400, 400, 400]);
    expect(await Reflection.count()).toBe(0);
});

test('public listing excludes approved reflections linked to an unpublished Song and all unapproved statuses', async () => {
    const visible = await createStoredReflection({ content: 'Visible', status: 'APPROVED' });
    await createStoredReflection({ content: 'Draft linked', songId: draftSong.id, status: 'APPROVED' });
    await createStoredReflection({ content: 'Pending', status: 'PENDING' });
    await createStoredReflection({ content: 'Flagged', status: 'FLAGGED' });
    await createStoredReflection({ content: 'Rejected', status: 'REJECTED' });
    const response = await request(app).get('/api/reflections');
    expect(response.body.reflections.map((item) => item.id)).toEqual([visible.id]);
});

test('another registered user cannot edit or delete an owned reflection while owner can', async () => {
    const reflection = await Reflection.create({
        content: 'Owned', displayMode: 'PROFILE', displayName: owner.name,
        guestSubmission: false, songId: song.id, status: 'APPROVED', tags: [], userId: owner.id,
    });
    const edit = await request(app).put(`/api/reflections/${reflection.id}`).set('Authorization', `Bearer ${otherOwnerToken}`).send({ content: 'Stolen', songId: song.id });
    const remove = await request(app).delete(`/api/reflections/${reflection.id}`).set('Authorization', `Bearer ${otherOwnerToken}`);
    expect(edit.status).toBe(403);
    expect(remove.status).toBe(403);
    const ownerEdit = await request(app).put(`/api/reflections/${reflection.id}`).set('Authorization', `Bearer ${ownerToken}`).send({ content: 'Owner edit', songId: song.id });
    expect(ownerEdit.status).toBe(200);
    expect((await request(app).delete(`/api/reflections/${reflection.id}`).set('Authorization', `Bearer ${ownerToken}`)).status).toBe(204);
});

test('creator can reject while non-creator moderation remains forbidden', async () => {
    const reflection = await createStoredReflection();
    const denied = await request(app).put(`/api/reflections/${reflection.id}/moderation`).set('Authorization', `Bearer ${ownerToken}`).send({ status: 'REJECTED' });
    expect(denied.status).toBe(403);
    const rejected = await request(app).put(`/api/reflections/${reflection.id}/moderation`).set('Authorization', `Bearer ${creatorToken}`).send({ status: 'REJECTED' });
    expect(rejected.status).toBe(200);
    expect(rejected.body.reflection.status).toBe('REJECTED');
    expect((await request(app).get('/api/reflections')).body.reflections).toHaveLength(0);
});

test('authenticated users can comment while guest comments, reports, moderation, and invalid content are rejected', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED', userId: owner.id });

    const guest = await request(app).post(`/api/reflections/${reflection.id}/comments`).send({ content: 'Hello' });
    expect(guest.status).toBe(401);

    const empty = await request(app).post(`/api/reflections/${reflection.id}/comments`)
        .set('Authorization', `Bearer ${otherOwnerToken}`).send({ content: ' \n\t ' });
    const tooLong = await request(app).post(`/api/reflections/${reflection.id}/comments`)
        .set('Authorization', `Bearer ${otherOwnerToken}`).send({ content: 'x'.repeat(501) });
    const prohibited = await request(app).post(`/api/reflections/${reflection.id}/comments`)
        .set('Authorization', `Bearer ${otherOwnerToken}`).send({ content: 'This is fucking awful.' });
    expect([empty.status, tooLong.status, prohibited.status]).toEqual([400, 400, 400]);
    expect(prohibited.body.message).toMatch(/community guidelines/i);

    const created = await request(app).post(`/api/reflections/${reflection.id}/comments`)
        .set('Authorization', `Bearer ${otherOwnerToken}`).send({ content: '  A thoughtful\n Singapore memory.  ' });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
        comment: {
            author: { avatarUrl: 'https://images.example/other.jpg', displayName: 'Other Keeper', id: otherOwner.id },
            canDelete: true,
            content: 'A thoughtful Singapore memory.',
        },
        commentCount: 1,
    });
    expect(created.body.comment.author).not.toHaveProperty('email');

    const guestReport = await request(app)
        .post(`/api/reflections/${reflection.id}/comments/${created.body.comment.id}/reports`)
        .send({ reason: 'Guests must sign in before reporting.' });
    const guestModeration = await request(app)
        .post(`/api/reflections/${reflection.id}/comments/${created.body.comment.id}/moderation`)
        .send({ action: 'REMOVE_COMMENT', reason: 'Guests cannot moderate.' });
    expect([guestReport.status, guestModeration.status]).toEqual([401, 401]);

    const listed = await request(app).get(`/api/reflections/${reflection.id}/comments`);
    expect(listed.status).toBe(200);
    expect(listed.body.comments).toHaveLength(1);
    expect(listed.body.comments[0].canDelete).toBe(false);
});

test('authenticated users can like and unlike individual comments without duplicates', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED', userId: owner.id });
    const comment = await ReflectionComment.create({
        content: 'A comment worth appreciating.', reflectionId: reflection.id,
        status: 'VISIBLE', userId: otherOwner.id,
    });

    const guestLike = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/like`);
    expect(guestLike.status).toBe(401);

    const first = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    const duplicate = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(first.body).toEqual({ likeCount: 1, liked: true });
    expect(duplicate.body).toEqual({ likeCount: 1, liked: true });
    expect(await ReflectionCommentLike.count({ where: { commentId: comment.id, userId: owner.id } })).toBe(1);

    const refreshed = await request(app).get(`/api/reflections/${reflection.id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(refreshed.body.comments[0]).toMatchObject({ id: comment.id, isLiked: true, likeCount: 1 });
    const publicView = await request(app).get(`/api/reflections/${reflection.id}/comments`);
    expect(publicView.body.comments[0]).toMatchObject({ id: comment.id, isLiked: false, likeCount: 1 });

    const removed = await request(app).delete(`/api/reflections/${reflection.id}/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    const duplicateRemoval = await request(app).delete(`/api/reflections/${reflection.id}/comments/${comment.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(removed.body).toEqual({ likeCount: 0, liked: false });
    expect(duplicateRemoval.body).toEqual({ likeCount: 0, liked: false });
});

test('comment authors, reflection owners, and admins can delete comments but unrelated users cannot', async () => {
    const reflection = await createStoredReflection({ guestSubmission: false, status: 'APPROVED', userId: owner.id });
    const makeComment = () => ReflectionComment.create({ content: 'A comment.', reflectionId: reflection.id, userId: otherOwner.id });

    const unrelatedComment = await makeComment();
    const denied = await request(app).delete(`/api/reflections/${reflection.id}/comments/${unrelatedComment.id}`)
        .set('Authorization', `Bearer ${creatorToken}`);
    expect(denied.status).toBe(403);

    const ownComment = await makeComment();
    expect((await request(app).delete(`/api/reflections/${reflection.id}/comments/${ownComment.id}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)).status).toBe(204);

    const ownerModerated = await makeComment();
    expect((await request(app).delete(`/api/reflections/${reflection.id}/comments/${ownerModerated.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)).status).toBe(204);

    const adminModerated = await makeComment();
    expect((await request(app).delete(`/api/reflections/${reflection.id}/comments/${adminModerated.id}`)
        .set('Authorization', `Bearer ${adminToken}`)).status).toBe(204);
    expect(await ReflectionComment.count({ where: { reflectionId: reflection.id } })).toBe(3);
    expect((await ReflectionComment.findByPk(ownerModerated.id)).status).toBe('REMOVED');
    expect((await ReflectionComment.findByPk(adminModerated.id)).status).toBe('REMOVED');
    expect(await ModerationAction.count({
        where: { actionType: 'REFLECTION_COMMENT_REMOVED', targetId: { [Op.in]: [ownerModerated.id, adminModerated.id] } },
    })).toBe(2);
    const restored = await request(app).post(`/api/reflections/${reflection.id}/comments/${adminModerated.id}/restore`)
        .set('Authorization', `Bearer ${adminToken}`).send({ reason: 'The safety review found no policy violation.' });
    expect(restored.status).toBe(200);
    expect((await ReflectionComment.findByPk(adminModerated.id)).status).toBe('VISIBLE');
});

test('public reflection identities link safely while anonymous reflections never expose their owner id', async () => {
    const named = await createStoredReflection({
        displayMode: 'PROFILE', displayName: 'Old Name', guestSubmission: false,
        status: 'APPROVED', userId: owner.id,
    });
    const anonymous = await createStoredReflection({
        displayMode: 'ANONYMOUS', displayName: null, guestSubmission: false,
        status: 'APPROVED', userId: owner.id,
    });
    const response = await request(app).get('/api/reflections');
    const namedBody = response.body.reflections.find((item) => item.id === named.id);
    const anonymousBody = response.body.reflections.find((item) => item.id === anonymous.id);
    expect(namedBody).toMatchObject({ author: { displayName: 'Memory Keeper', id: owner.id }, displayName: 'Memory Keeper' });
    expect(namedBody.author).not.toHaveProperty('email');
    expect(anonymousBody).toMatchObject({ author: null, displayName: 'Anonymous', isAnonymous: true });
    expect(anonymousBody).not.toHaveProperty('userId');
    expect(JSON.stringify(anonymousBody)).not.toContain(owner.id);
});

test('account like and unlike are idempotent and keep one active like per user', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED' });
    const first = await request(app).post(`/api/reflections/${reflection.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    const duplicate = await request(app).post(`/api/reflections/${reflection.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(first.body).toEqual({ likeCount: 1, liked: true });
    expect(duplicate.body).toEqual({ likeCount: 1, liked: true });
    expect(await ReflectionLike.count({ where: { reflectionId: reflection.id, userId: owner.id } })).toBe(1);

    const unliked = await request(app).delete(`/api/reflections/${reflection.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    const duplicateUnlike = await request(app).delete(`/api/reflections/${reflection.id}/like`)
        .set('Authorization', `Bearer ${ownerToken}`);
    expect(unliked.body).toEqual({ likeCount: 0, liked: false });
    expect(duplicateUnlike.body).toEqual({ likeCount: 0, liked: false });
});

test('guest like cookie persists refresh state and guest like/unlike stays idempotent', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED' });
    const guest = request.agent(app);
    const initial = await guest.get('/api/reflections');
    expect(initial.status).toBe(200);
    expect(initial.headers['set-cookie'][0]).toMatch(new RegExp(`^${GUEST_LIKE_COOKIE}=[0-9a-f-]+;`));
    expect(initial.headers['set-cookie'][0]).toContain('Max-Age=15552000');
    expect(initial.headers['set-cookie'][0]).toContain('Path=/');
    expect(initial.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(initial.headers['set-cookie'][0]).toContain('SameSite=Lax');
    const guestId = initial.headers['set-cookie'][0].match(new RegExp(`${GUEST_LIKE_COOKIE}=([^;]+)`))[1];
    expect(JSON.stringify(initial.body)).not.toContain(guestId);
    expect(initial.body.reflections.find((item) => item.id === reflection.id).isLiked).toBe(false);

    const first = await guest.post(`/api/reflections/${reflection.id}/like`);
    const duplicate = await guest.post(`/api/reflections/${reflection.id}/like`);
    expect(first.body).toEqual({ likeCount: 1, liked: true });
    expect(duplicate.body).toEqual({ likeCount: 1, liked: true });
    expect(await GuestReflectionLike.count({ where: { reflectionId: reflection.id } })).toBe(1);

    const refreshed = await guest.get('/api/reflections');
    expect(refreshed.body.reflections.find((item) => item.id === reflection.id)).toMatchObject({ isLiked: true, likeCount: 1 });
    expect((await guest.delete(`/api/reflections/${reflection.id}/like`)).body).toEqual({ likeCount: 0, liked: false });
    expect((await guest.delete(`/api/reflections/${reflection.id}/like`)).body).toEqual({ likeCount: 0, liked: false });
    expect((await guest.get('/api/reflections')).body.reflections.find((item) => item.id === reflection.id)).toMatchObject({ isLiked: false, likeCount: 0 });
});

test('production guest identity cookies require secure cross-site transport', async () => {
    const previousEnvironment = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
        await createStoredReflection({ status: 'APPROVED' });
        const response = await request(app).get('/api/reflections');
        expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
        expect(response.headers['set-cookie'][0]).toContain('Secure');
        expect(response.headers['set-cookie'][0]).toContain('SameSite=None');
    } finally {
        process.env.NODE_ENV = previousEnvironment;
    }
});

test('missing and expired guest identifiers are replaced without reviving old likes', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED' });
    const missing = await request(app).post(`/api/reflections/${reflection.id}/like`);
    expect(missing.status).toBe(200);
    expect(missing.headers['set-cookie'][0]).toContain(`${GUEST_LIKE_COOKIE}=`);

    const expiredId = crypto.randomUUID();
    await GuestLikeSession.create({ expiresAt: new Date(Date.now() - 1000), id: expiredId });
    await GuestReflectionLike.create({ guestSessionId: expiredId, reflectionId: reflection.id });
    const expired = await request(app).get('/api/reflections').set('Cookie', `${GUEST_LIKE_COOKIE}=${expiredId}`);
    expect(expired.status).toBe(200);
    expect(expired.body.reflections.find((item) => item.id === reflection.id).isLiked).toBe(false);
    expect(expired.headers['set-cookie'].some((value) => value.startsWith(`${GUEST_LIKE_COOKIE}=`) && !value.includes(expiredId))).toBe(true);
    expect(await GuestLikeSession.findByPk(expiredId)).toBeNull();
    expect(await GuestReflectionLike.count({ where: { guestSessionId: expiredId } })).toBe(0);
});

test('login merges guest likes into account likes without double-counting existing account likes', async () => {
    const duplicateReflection = await createStoredReflection({ status: 'APPROVED' });
    const guestOnlyReflection = await createStoredReflection({ content: 'A second liked reflection.', status: 'APPROVED' });
    await ReflectionLike.create({ reflectionId: duplicateReflection.id, userId: owner.id });
    const guest = request.agent(app);
    await guest.get('/api/reflections');
    await guest.post(`/api/reflections/${duplicateReflection.id}/like`);
    await guest.post(`/api/reflections/${guestOnlyReflection.id}/like`);
    expect(await GuestReflectionLike.count()).toBe(2);

    const login = await guest.post('/api/auth/login').send({ email: owner.email, password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.headers['set-cookie'].some((value) => value.startsWith(`${GUEST_LIKE_COOKIE}=`) && value.includes('Expires=Thu, 01 Jan 1970'))).toBe(true);
    expect(await GuestReflectionLike.count()).toBe(0);
    expect(await GuestLikeSession.count()).toBe(0);
    expect(await ReflectionLike.count({ where: { userId: owner.id } })).toBe(2);

    const refreshed = await request(app).get('/api/reflections').set('Authorization', `Bearer ${login.body.token}`);
    expect(refreshed.body.reflections.find((item) => item.id === duplicateReflection.id)).toMatchObject({ isLiked: true, likeCount: 1 });
    expect(refreshed.body.reflections.find((item) => item.id === guestOnlyReflection.id)).toMatchObject({ isLiked: true, likeCount: 1 });
});

test('public counts and most-liked and most-discussed sorting use visible discussion activity', async () => {
    const newest = await createStoredReflection({ content: 'Newest', createdAt: new Date('2026-01-03T00:00:00Z'), status: 'APPROVED' });
    const liked = await createStoredReflection({ content: 'Liked', createdAt: new Date('2026-01-02T00:00:00Z'), status: 'APPROVED' });
    const discussed = await createStoredReflection({ content: 'Discussed', createdAt: new Date('2026-01-01T00:00:00Z'), status: 'APPROVED' });
    await ReflectionLike.bulkCreate([
        { reflectionId: liked.id, userId: owner.id },
        { reflectionId: liked.id, userId: otherOwner.id },
        { reflectionId: newest.id, userId: owner.id },
    ]);
    const guestSession = await GuestLikeSession.create({ expiresAt: new Date(Date.now() + 60_000) });
    await GuestReflectionLike.create({ guestSessionId: guestSession.id, reflectionId: liked.id });
    await ReflectionComment.bulkCreate([
        { content: 'One', reflectionId: discussed.id, userId: owner.id },
        { content: 'Two', reflectionId: discussed.id, userId: otherOwner.id },
        { content: 'Hidden', reflectionId: discussed.id, status: 'REMOVED', userId: owner.id },
        { content: 'One', reflectionId: newest.id, userId: owner.id },
    ]);

    const byLikes = await request(app).get('/api/reflections?sort=most_liked').set('Authorization', `Bearer ${ownerToken}`);
    expect(byLikes.body.reflections.map((item) => item.id)).toEqual([liked.id, newest.id, discussed.id]);
    expect(byLikes.body.reflections.find((item) => item.id === liked.id).likeCount).toBe(3);
    expect(byLikes.body.reflections.find((item) => item.id === newest.id)).toMatchObject({ commentCount: 1, isLiked: true, likeCount: 1 });

    const byComments = await request(app).get('/api/reflections?sort=most_discussed');
    expect(byComments.body.reflections.map((item) => item.id)).toEqual([discussed.id, newest.id, liked.id]);
    expect(byComments.body.reflections[0]).toMatchObject({ commentCount: 2, isLiked: false, likeCount: 0 });
});

test('rapid repeated comment submission is rate limited per authenticated account', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED' });
    const responses = [];
    for (let index = 0; index < 7; index += 1) {
        responses.push(await request(app).post(`/api/reflections/${reflection.id}/comments`)
            .set('Authorization', `Bearer ${ownerToken}`).send({ content: `Comment ${index}` }));
    }
    expect(responses.slice(0, 6).every((response) => response.status === 201)).toBe(true);
    expect(responses[6].status).toBe(429);
    expect(responses[6].headers['retry-after']).toBeTruthy();
});

test('server-side community filtering accepts normal text and rejects vulgar reflection and comment bypass attempts', async () => {
    const normal = await request(app).post('/api/reflections').set('Authorization', `Bearer ${ownerToken}`).send({
        content: 'Singapore memories bring our neighbours together.', songId: song.id,
    });
    expect(normal.status).toBe(201);

    for (const content of ['F.U.C.K this memory', 'f u c k this', 'SH!!!T', 'fuuuck this']) {
        const rejected = await request(app).post('/api/reflections').set('Authorization', `Bearer ${ownerToken}`).send({ content, songId: song.id });
        expect(rejected.status).toBe(400);
        expect(rejected.body.message).toMatch(/community guidelines/i);
    }

    const reflection = await createStoredReflection({ status: 'APPROVED' });
    for (const content of ['F.U.C.K this comment', 'sh!t']) {
        const rejected = await request(app).post(`/api/reflections/${reflection.id}/comments`)
            .set('Authorization', `Bearer ${ownerToken}`).send({ content });
        expect(rejected.status).toBe(400);
        expect(rejected.body.message).toMatch(/community guidelines/i);
    }
});

test('likes persist in refreshed public state and duplicate database rows remain impossible', async () => {
    const reflection = await createStoredReflection({ status: 'APPROVED' });
    await request(app).post(`/api/reflections/${reflection.id}/like`).set('Authorization', `Bearer ${ownerToken}`);
    await request(app).post(`/api/reflections/${reflection.id}/like`).set('Authorization', `Bearer ${ownerToken}`);
    const refreshed = await request(app).get('/api/reflections').set('Authorization', `Bearer ${ownerToken}`);
    expect(refreshed.body.reflections.find((item) => item.id === reflection.id)).toMatchObject({ isLiked: true, likeCount: 1 });
    await expect(ReflectionLike.create({ reflectionId: reflection.id, userId: owner.id })).rejects.toBeTruthy();
});

test('comment reports are unique and song creators can inspect, dismiss, remove, and warn with audit history', async () => {
    const reflection = await createStoredReflection({ guestSubmission: false, status: 'APPROVED', userId: owner.id });
    const comment = await ReflectionComment.create({ content: 'A reportable comment.', reflectionId: reflection.id, userId: otherOwner.id });
    const reportResponse = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/reports`)
        .set('Authorization', `Bearer ${ownerToken}`).send({ reason: 'This needs a closer safety review.' });
    expect(reportResponse.status).toBe(201);
    const reportId = reportResponse.body.report.id;
    const duplicate = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/reports`)
        .set('Authorization', `Bearer ${ownerToken}`).send({ reason: 'Trying the same report again.' });
    expect(duplicate.status).toBe(409);
    expect(await ReflectionCommentReport.count({ where: { commentId: comment.id, reporterId: owner.id } })).toBe(1);

    const foreignCreator = await request(app).get(`/api/reflections/${reflection.id}/moderation-discussion`)
        .set('Authorization', `Bearer ${otherCreatorToken}`);
    expect(foreignCreator.status).toBe(404);
    const evidence = await request(app).get(`/api/reflections/${reflection.id}/moderation-discussion`)
        .set('Authorization', `Bearer ${creatorToken}`);
    expect(evidence.status).toBe(200);
    expect(evidence.body.comments[0]).toMatchObject({
        author: { id: otherOwner.id, name: 'Other Keeper' }, content: 'A reportable comment.',
        reports: [{ id: reportId, status: 'PENDING' }], status: 'VISIBLE',
    });
    expect(evidence.body.comments[0].createdAt).toBeTruthy();

    const dismissed = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ action: 'KEEP_COMMENT', reason: 'Reviewed in context and the comment may remain.', reportId });
    expect(dismissed.status).toBe(200);
    expect((await ReflectionCommentReport.findByPk(reportId)).status).toBe('DISMISSED');

    const secondComment = await ReflectionComment.create({ content: 'Remove this evidence.', reflectionId: reflection.id, userId: otherOwner.id });
    const secondReport = await ReflectionCommentReport.create({ commentId: secondComment.id, reason: 'It violates discussion expectations.', reporterId: owner.id });
    const removed = await request(app).post(`/api/reflections/${reflection.id}/comments/${secondComment.id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ action: 'REMOVE_COMMENT', reason: 'Confirmed inappropriate after creator review.', reportId: secondReport.id });
    expect(removed.status).toBe(200);
    expect((await ReflectionComment.findByPk(secondComment.id)).status).toBe('REMOVED');
    expect((await ReflectionCommentReport.findByPk(secondReport.id)).status).toBe('ACTIONED');

    const warned = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ action: 'WARN_USER', reason: 'Please keep future discussion constructive.' });
    expect(warned.status).toBe(200);
    expect(await UserWarning.count({ where: { issuedBy: creator.id, userId: otherOwner.id } })).toBe(1);
    const actions = await ModerationAction.findAll({ where: { targetType: 'REFLECTION_COMMENT' } });
    expect(actions.map((action) => action.actionType)).toEqual(expect.arrayContaining([
        'REFLECTION_COMMENT_REPORT_DISMISSED', 'REFLECTION_COMMENT_REMOVED', 'USER_WARNED_FROM_REFLECTION_COMMENT',
    ]));
});

test('creator cannot moderate a comment on another creator song while admin retains platform authority', async () => {
    const reflection = await createStoredReflection({ songId: otherCreatorSong.id, status: 'APPROVED' });
    const comment = await ReflectionComment.create({ content: 'Cross-owner moderation target.', reflectionId: reflection.id, userId: owner.id });
    const denied = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/moderation`)
        .set('Authorization', `Bearer ${creatorToken}`)
        .send({ action: 'REMOVE_COMMENT', reason: 'Creator should not reach this discussion.' });
    expect(denied.status).toBe(404);
    expect((await ReflectionComment.findByPk(comment.id)).status).toBe('VISIBLE');

    const allowed = await request(app).post(`/api/reflections/${reflection.id}/comments/${comment.id}/moderation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ action: 'REMOVE_COMMENT', reason: 'Administrator platform-wide moderation review.' });
    expect(allowed.status).toBe(200);
    expect((await ReflectionComment.findByPk(comment.id)).status).toBe('REMOVED');
});
