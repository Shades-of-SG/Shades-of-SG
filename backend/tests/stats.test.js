const request = require('supertest');

const mockGetStats = jest.fn();
jest.mock('../services/statsService', () => ({ getStats: mockGetStats }));

const app = require('../server');

describe('community statistics route', () => {
    beforeEach(() => {
        mockGetStats.mockReset();
    });

    test('GET /api/stats is publicly readable by guests', async () => {
        mockGetStats.mockResolvedValue({
            reflectionsCount: 8,
            songsCount: 5,
            usersCount: 12,
        });

        const response = await request(app).get('/api/stats');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ reflectionsCount: 8, songsCount: 5, usersCount: 12 });
        expect(mockGetStats).toHaveBeenCalled();
    });
});
