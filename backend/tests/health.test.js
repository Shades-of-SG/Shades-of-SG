const request = require('supertest');
const app = require('../server');

test('GET /api/health returns service health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
        status: 'ok',
        service: 'shades-of-sg-api',
    });
});
