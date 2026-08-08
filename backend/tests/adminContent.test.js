/**
 * Owner: Ferlyn
 * Feature: Administrator Content Management
 */
const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'admin-content.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const {
    AuditLog, Folder, FolderSongProposal, Reflection, Song, SongFolder, User, sequelize,
} = require('../models');
const { createToken, hashPassword } = require('../services/authService');

let admin;
let creator;
let otherCreator;
let completeReadySong;
let incompleteReadySong;
let publishedSong;

const auth = () => ({ Authorization: `Bearer ${createToken(admin)}` });

beforeAll(async () => {
    await sequelize.sync({ force: true });
    const passwordHash = hashPassword('password123');
    admin = await User.create({ email: 'content-admin@example.com', name: 'Content Admin', passwordHash, role: 'ADMIN' });
    creator = await User.create({ email: 'content-creator@example.com', name: 'Content Creator', passwordHash, role: 'CREATOR' });
    otherCreator = await User.create({ email: 'other-creator@example.com', name: 'Other Creator', passwordHash, role: 'CREATOR' });
    completeReadySong = await Song.create({
        artist: 'Content Creator', audioUrl: 'https://media.example/song.mp3', coverImageUrl: 'https://media.example/cover.jpg',
        creatorId: creator.id, description: 'A complete song.', languages: ['English'], rawLyrics: 'Lyrics',
        status: 'READY', theme: 'Home', title: 'Ready for Review', videoUrl: 'https://media.example/song.mp4',
    });
    incompleteReadySong = await Song.create({ creatorId: creator.id, status: 'READY', title: 'Missing Media' });
    publishedSong = await Song.create({
        artist: 'Other Creator', creatorId: otherCreator.id, languages: ['English'], publishedDate: new Date(),
        status: 'PUBLISHED', title: 'Already Public',
    });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('song review metadata reports workflow, visibility, readiness, and malformed filters safely', async () => {
    const response = await request(app).get('/api/admin/songs').set(auth());
    expect(response.status).toBe(200);
    expect(response.body.songStatuses).toEqual(['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED']);
    expect(response.body.visibilityOptions).toEqual(['PUBLIC', 'NOT_PUBLIC']);
    expect(response.body.songs.find((song) => song.id === publishedSong.id)).toMatchObject({ publiclyVisible: true });
    expect(response.body.songs.find((song) => song.id === completeReadySong.id)).toMatchObject({
        availableActions: expect.arrayContaining(['VIEW_DETAILS', 'PREVIEW', 'PUBLISH', 'ARCHIVE']),
        publishReadiness: { missingFields: [], ready: true }, publiclyVisible: false,
    });
    expect(response.body.songs.find((song) => song.id === incompleteReadySong.id).publishReadiness).toMatchObject({ ready: false });
    expect((await request(app).get('/api/admin/songs').query({ creatorId: 'not-a-uuid' }).set(auth())).status).toBe(400);
});

test('admin publish validates eligibility, preserves ownership, blocks duplicates, and writes audit', async () => {
    const incomplete = await request(app).post(`/api/admin/songs/${incompleteReadySong.id}/publish`).set(auth()).send({});
    expect(incomplete.status).toBe(400);
    expect(incomplete.body.missingFields).toContain('videoUrl');

    const published = await request(app).post(`/api/admin/songs/${completeReadySong.id}/publish`).set(auth()).send({ note: 'Reviewed against the publication checklist.' });
    expect(published.status).toBe(200);
    expect(published.body.song).toMatchObject({ creatorId: creator.id, publiclyVisible: true, status: 'PUBLISHED' });
    expect((await completeReadySong.reload()).creatorId).toBe(creator.id);
    expect(completeReadySong.publishedDate).not.toBeNull();
    expect((await request(app).post(`/api/admin/songs/${completeReadySong.id}/publish`).set(auth()).send({})).status).toBe(409);
    expect(await AuditLog.count({ where: { action: 'SONG_PUBLISHED_BY_ADMIN', creatorId: creator.id, songId: completeReadySong.id } })).toBe(1);
});

test('unpublish and archive preserve creator data, dependent rows, and collection links', async () => {
    const folder = await Folder.create({ createdBy: admin.id, name: 'Preserved Links', origin: 'PLATFORM', slug: 'preserved-links', status: 'APPROVED' });
    await SongFolder.create({ addedBy: admin.id, folderId: folder.id, songId: completeReadySong.id, songOrder: 0 });
    await Reflection.create({ content: 'A retained reflection.', guestSubmission: true, songId: completeReadySong.id, status: 'APPROVED' });

    const unpublished = await request(app).post(`/api/admin/songs/${completeReadySong.id}/unpublish`).set(auth()).send({ reason: 'Temporarily remove from public access.' });
    expect(unpublished.status).toBe(200);
    expect(unpublished.body.song).toMatchObject({ creatorId: creator.id, publiclyVisible: false, status: 'READY' });
    expect((await completeReadySong.reload()).publishedDate).toBeNull();
    expect(await Reflection.count({ where: { songId: completeReadySong.id } })).toBe(1);
    expect(await SongFolder.count({ where: { folderId: folder.id, songId: completeReadySong.id } })).toBe(1);

    const archived = await request(app).post(`/api/admin/songs/${completeReadySong.id}/archive`).set(auth()).send({ reason: 'Preserve outside the active workflow.' });
    expect(archived.status).toBe(200);
    expect(archived.body.song).toMatchObject({ creatorId: creator.id, status: 'ARCHIVED' });
    expect(await Reflection.count({ where: { songId: completeReadySong.id } })).toBe(1);
    expect(await SongFolder.count({ where: { folderId: folder.id, songId: completeReadySong.id } })).toBe(1);
    expect((await request(app).post(`/api/admin/songs/${completeReadySong.id}/restore`).set(auth()).send({})).body.song.status).toBe('READY');
    expect(await AuditLog.count({ where: { songId: completeReadySong.id } })).toBe(4);
});

test('platform collection validation and membership rules prevent duplicates and unpublished placement', async () => {
    expect((await request(app).post('/api/admin/folders').set(auth()).send({ name: '' })).status).toBe(400);
    const created = await request(app).post('/api/admin/folders').set(auth()).send({ description: 'Published songs only.', displayOrder: 2, name: 'Public Heritage' });
    expect(created.status).toBe(201);
    expect(created.body.folder).toMatchObject({ allowedTransitions: ['ARCHIVED'], origin: 'PLATFORM', publiclyVisible: true, status: 'APPROVED' });
    expect((await request(app).post('/api/admin/folders').set(auth()).send({ name: 'public heritage' })).status).toBe(409);
    const folderId = created.body.folder.id;
    expect((await request(app).put(`/api/admin/folders/${folderId}/songs/${incompleteReadySong.id}`).set(auth()).send({ songOrder: 0 })).status).toBe(409);
    expect((await request(app).put(`/api/admin/folders/${folderId}/songs/${publishedSong.id}`).set(auth()).send({ songOrder: 0 })).status).toBe(201);
    expect((await request(app).put(`/api/admin/folders/${folderId}/songs/${publishedSong.id}`).set(auth()).send({ songOrder: 1 })).status).toBe(200);
    expect(await SongFolder.count({ where: { folderId, songId: publishedSong.id } })).toBe(1);
    expect((await request(app).delete(`/api/admin/folders/${folderId}/songs/${publishedSong.id}`).set(auth())).status).toBe(204);
    expect((await publishedSong.reload()).status).toBe('PUBLISHED');
    expect((await request(app).patch(`/api/admin/folders/${folderId}`).set(auth()).send({ status: 'REJECTED' })).status).toBe(409);
    expect((await request(app).patch('/api/admin/folders/not-a-uuid').set(auth()).send({ status: 'ARCHIVED' })).status).toBe(400);
});

test('placement approval adds the intended published song while rejection preserves records', async () => {
    const folder = await Folder.create({ createdBy: admin.id, name: 'Placement Target', origin: 'PLATFORM', slug: 'placement-target', status: 'APPROVED' });
    const approvedProposal = await FolderSongProposal.create({ creatorNote: 'A good thematic fit.', folderId: folder.id, proposedBy: otherCreator.id, songId: publishedSong.id, status: 'PENDING' });
    const approved = await request(app).patch(`/api/admin/folder-song-proposals/${approvedProposal.id}`).set(auth()).send({ songOrder: 3, status: 'APPROVED' });
    expect(approved.status).toBe(200);
    expect(await SongFolder.count({ where: { folderId: folder.id, songId: publishedSong.id } })).toBe(1);
    expect((await publishedSong.reload()).creatorId).toBe(otherCreator.id);
    expect((await approvedProposal.reload()).reviewedBy).toBe(admin.id);
    const listed = await request(app).get('/api/admin/folder-song-proposals').set(auth());
    expect(listed.status).toBe(200);
    expect(listed.body.proposals.find((item) => item.id === approvedProposal.id)).toMatchObject({ proposalReviewer: { id: admin.id, name: admin.name } });

    const rejectedSong = await Song.create({ creatorId: creator.id, status: 'DRAFT', title: 'Preserved Rejection Song' });
    const rejectedProposal = await FolderSongProposal.create({ folderId: folder.id, proposedBy: creator.id, songId: rejectedSong.id, status: 'PENDING' });
    const rejected = await request(app).patch(`/api/admin/folder-song-proposals/${rejectedProposal.id}`).set(auth()).send({ reviewNote: 'Needs publication readiness first.', status: 'REJECTED' });
    expect(rejected.status).toBe(200);
    expect((await rejectedProposal.reload()).status).toBe('REJECTED');
    expect(await Song.count({ where: { id: rejectedSong.id, creatorId: creator.id } })).toBe(1);
    expect(await SongFolder.count({ where: { folderId: folder.id, songId: rejectedSong.id } })).toBe(0);
    expect(await AuditLog.count({ where: { entityId: rejectedProposal.id, action: 'SONG_FOLDER_PROPOSAL_REJECTED' } })).toBe(1);
});
