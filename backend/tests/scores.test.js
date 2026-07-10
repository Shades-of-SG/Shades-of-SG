const request = require('supertest');
const app = require('../server');

const demoScorePayload = {
    accuracy: 97.5,
    difficulty: 'easy',
    maxCombo: 42,
    rank: 'a',
    score: 12345,
    songId: 'demo-song',
};

test('POST /api/scores accepts demo-song scores without writing a UUID song id', async () => {
    const response = await request(app).post('/api/scores').send(demoScorePayload);

    expect(response.status).toBe(201);
    expect(response.body.score).toMatchObject({
        accuracy: 97.5,
        difficulty: 'EASY',
        maxCombo: 42,
        rank: 'A',
        score: 12345,
        songId: 'demo-song',
        demo: true,
    });
});

test('POST /api/scores rejects malformed non-demo song ids', async () => {
    const response = await request(app)
        .post('/api/scores')
        .send({ ...demoScorePayload, songId: 'not-a-real-song' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
        message: 'songId must be a valid song id',
    });
});
