const request = require('supertest');

const mockGetStats = jest.fn();
jest.mock('../services/statsService', () => ({ getStats: mockGetStats }));

const app = require('../server');

describe('admin statistics route', () => {
    beforeEach(() => {
        mockGetStats.mockReset();
    });

    test('GET /api/stats rejects public access before reading statistics', async () => {
        mockGetStats.mockResolvedValue({
            reflectionsCount: 8,
            songsCount: 5,
            usersCount: 12,
        });

        const response = await request(app).get('/api/stats');

        expect(response.status).toBe(401);
        expect(mockGetStats).not.toHaveBeenCalled();
    });
});
