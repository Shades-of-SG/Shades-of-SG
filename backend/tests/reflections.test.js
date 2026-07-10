const path = require('path');
const fs = require('fs');

process.env.DATABASE_URL = '';
const testDatabasePath = path.join(__dirname, 'reflections.test.sqlite');
process.env.DB_STORAGE = testDatabasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, Song, User } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

let song;
let token;

beforeAll(async () => {
    await sequelize.sync({ force: true });
    const user = await User.create({
        email: 'reflection-owner@example.com',
        name: 'Memory Keeper',
        passwordHash: hashPassword('password123'),
    });
    song = await Song.create({ title: 'Test Song', status: 'PUBLISHED' });
    token = createToken(user);
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(testDatabasePath)) fs.unlinkSync(testDatabasePath);
});

test('reflection owner can create, read, update, and delete a reflection', async () => {
    const created = await request(app)
        .post('/api/reflections')
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'A memory of home.', isAnonymous: false, songId: song.id });

    expect(created.status).toBe(201);
    expect(created.body.reflection).toMatchObject({
        content: 'A memory of home.',
        displayName: 'Memory Keeper',
        isOwner: true,
        song: { title: 'Test Song' },
    });

    const id = created.body.reflection.id;
    const listed = await request(app).get('/api/reflections');
    expect(listed.status).toBe(200);
    expect(listed.body.reflections).toHaveLength(1);

    const updated = await request(app)
        .put(`/api/reflections/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ content: 'An updated memory.', isAnonymous: true, songId: song.id });
    expect(updated.status).toBe(200);
    expect(updated.body.reflection).toMatchObject({ content: 'An updated memory.', isAnonymous: true });

    const deleted = await request(app)
        .delete(`/api/reflections/${id}`)
        .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
});

test('creating a reflection requires login', async () => {
    const response = await request(app)
        .post('/api/reflections')
        .send({ content: 'A memory.', songId: song.id });

    expect(response.status).toBe(401);
});
