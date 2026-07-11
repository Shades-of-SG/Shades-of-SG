const request = require('supertest');
const app = require('../server');

const scorePayload = {
    accuracy: 97.5,
    difficulty: 'easy',
    maxCombo: 42,
    rank: 'a',
    score: 12345,
    songId: 'not-a-real-song',
};

test('POST /api/scores rejects malformed song ids', async () => {
    const response = await request(app)
        .post('/api/scores')
        .send(scorePayload);

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
        message: 'songId must be a valid song id',
    });
});
