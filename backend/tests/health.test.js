/**
 * Owner: Shared across the team
 * Feature: Backend Health & Infrastructure
 */
const request = require('supertest');
const app = require('../server');
const sequelize = require('../config/database');
const { createToken } = require('../services/authService');

test('GET /api/health returns service health', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
        status: 'ok',
        service: 'shades-of-sg-api',
    });
});

test('tests are isolated from configured production databases', () => {
    expect(sequelize.getDialect()).toBe('sqlite');
});

test('CORS allows the configured local frontend origin', async () => {
    const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
});

test('CORS rejects an unknown browser origin', async () => {
    const response = await request(app)
        .options('/api/auth/login')
        .set('Access-Control-Request-Method', 'POST')
        .set('Origin', 'https://unknown.example');

    expect(response.status).toBe(403);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
});

test('CORS preflight allows configured additional frontend origins', async () => {
    const previous = process.env.FRONTEND_URLS;
    process.env.FRONTEND_URLS = 'https://preview-one.vercel.app, https://preview-two.vercel.app/';

    try {
        const response = await request(app)
            .options('/api/auth/register')
            .set('Access-Control-Request-Headers', 'content-type')
            .set('Access-Control-Request-Method', 'POST')
            .set('Origin', 'https://preview-two.vercel.app');

        expect(response.status).toBe(204);
        expect(response.headers['access-control-allow-origin']).toBe('https://preview-two.vercel.app');
        expect(response.headers['access-control-allow-methods']).toContain('POST');
    } finally {
        if (previous === undefined) delete process.env.FRONTEND_URLS;
        else process.env.FRONTEND_URLS = previous;
    }
});

test('CORS allows only Vercel previews matching a configured project pattern', async () => {
    const previous = process.env.FRONTEND_URL_PATTERNS;
    process.env.FRONTEND_URL_PATTERNS = 'https://shades-of-*-unpaid-interns-projects.vercel.app';

    try {
        const allowed = await request(app)
            .options('/api/auth/register')
            .set('Access-Control-Request-Method', 'POST')
            .set('Origin', 'https://shades-of-3qjbiuohz-unpaid-interns-projects.vercel.app');
        const rejected = await request(app)
            .options('/api/auth/register')
            .set('Access-Control-Request-Method', 'POST')
            .set('Origin', 'https://shades-of-3qjbiuohz-another-team.vercel.app');

        expect(allowed.status).toBe(204);
        expect(allowed.headers['access-control-allow-origin']).toBe('https://shades-of-3qjbiuohz-unpaid-interns-projects.vercel.app');
        expect(rejected.status).toBe(403);
        expect(rejected.headers['access-control-allow-origin']).toBeUndefined();
    } finally {
        if (previous === undefined) delete process.env.FRONTEND_URL_PATTERNS;
        else process.env.FRONTEND_URL_PATTERNS = previous;
    }
});

test('production token creation requires a configured signing secret', () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousAuthSecret = process.env.AUTH_TOKEN_SECRET;
    const previousJwtSecret = process.env.JWT_SECRET;

    process.env.NODE_ENV = 'production';
    delete process.env.AUTH_TOKEN_SECRET;
    delete process.env.JWT_SECRET;

    try {
        expect(() => createToken({ email: 'user@example.com', id: 'user-id', role: 'REGISTERED' }))
            .toThrow('AUTH_TOKEN_SECRET or JWT_SECRET is required in production.');
    } finally {
        if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
        else process.env.NODE_ENV = previousNodeEnv;
        if (previousAuthSecret === undefined) delete process.env.AUTH_TOKEN_SECRET;
        else process.env.AUTH_TOKEN_SECRET = previousAuthSecret;
        if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousJwtSecret;
    }
});
