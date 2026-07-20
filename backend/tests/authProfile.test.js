const fs = require('fs');
const path = require('path');

process.env.DATABASE_URL = '';
const databasePath = path.join(__dirname, 'auth-profile.test.sqlite');
process.env.DB_STORAGE = databasePath;

const request = require('supertest');
const app = require('../server');
const { sequelize, User } = require('../models');
const { createToken, hashPassword } = require('../services/authService');

let user;
const authorization = (account) => ({ Authorization: `Bearer ${createToken(account)}` });

beforeAll(async () => {
    await sequelize.sync({ force: true });
    user = await User.create({ email: 'memory@example.com', name: 'Memory Keeper', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
    await User.create({ email: 'taken@example.com', name: 'Taken', passwordHash: hashPassword('password123'), role: 'REGISTERED' });
});

afterAll(async () => {
    await sequelize.close();
    if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath);
});

test('registered user can update supported profile fields', async () => {
    const response = await request(app)
        .put('/api/auth/profile')
        .set(authorization(user))
        .send({ email: 'updated@example.com', name: 'Updated Keeper' });

    expect(response.status).toBe(200);
    expect(response.body.user).toMatchObject({ email: 'updated@example.com', id: user.id, name: 'Updated Keeper', role: 'REGISTERED' });
    expect(response.body.user.createdAt).toBeTruthy();
});

test('profile update requires authentication', async () => {
    const response = await request(app).put('/api/auth/profile').send({ email: 'new@example.com', name: 'New Name' });
    expect(response.status).toBe(401);
});

test('profile update rejects an email owned by another account', async () => {
    const response = await request(app)
        .put('/api/auth/profile')
        .set(authorization(user))
        .send({ email: 'taken@example.com', name: 'Updated Keeper' });

    expect(response.status).toBe(409);
    expect(response.body.message).toMatch(/already exists/i);
});
