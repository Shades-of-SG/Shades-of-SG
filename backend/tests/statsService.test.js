const mockUser = { count: jest.fn() };
const mockSong = { count: jest.fn() };
const mockReflection = { count: jest.fn() };

jest.mock('../models', () => ({ Reflection: mockReflection, Song: mockSong, User: mockUser }));

const { getStats } = require('../services/statsService');

describe('statistics service', () => {
    test('counts registered explorers, published songs, and approved reflections', async () => {
        mockUser.count.mockResolvedValue(14);
        mockSong.count.mockResolvedValue(6);
        mockReflection.count.mockResolvedValue(9);

        await expect(getStats()).resolves.toEqual({
            reflectionsCount: 9,
            songsCount: 6,
            usersCount: 14,
        });
        expect(mockUser.count).toHaveBeenCalledWith({ where: { role: 'REGISTERED' } });
        expect(mockSong.count).toHaveBeenCalledWith({ where: { status: 'PUBLISHED' } });
        expect(mockReflection.count).toHaveBeenCalledWith({ where: { status: 'APPROVED' } });
    });
});
