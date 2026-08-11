const { EventEmitter } = require('events');

const mockSpawn = jest.fn();
jest.mock('child_process', () => ({ spawn: mockSpawn }));

const { getYouTubeMetadata } = require('../services/audioExtractionService');

function mockProcess() {
    const child = new EventEmitter();
    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(child);
    return child;
}

describe('YouTube extraction configuration', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        mockSpawn.mockReset();
        jest.restoreAllMocks();
    });

    test('uses the configured JavaScript runtime, EJS source, and cookie file for metadata', async () => {
        process.env.YT_DLP_JS_RUNTIME = 'node';
        process.env.YT_DLP_REMOTE_COMPONENT = 'ejs:github';
        process.env.YT_DLP_COOKIES_PATH = __filename;
        const child = mockProcess();

        const resultPromise = getYouTubeMetadata('https://www.youtube.com/watch?v=abcdefghijk');
        child.stdout.emit('data', Buffer.from(JSON.stringify({ duration: 12.4, id: 'abcdefghijk', title: 'Test song' })));
        child.emit('close', 0);

        await expect(resultPromise).resolves.toEqual({ durationSecs: 12, title: 'Test song', videoId: 'abcdefghijk' });
        expect(mockSpawn).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
            '--js-runtimes', 'node', '--remote-components', 'ejs:github', '--cookies', __filename,
        ]), { windowsHide: true });
    });

    test('turns the YouTube bot challenge into a safe actionable error', async () => {
        const child = mockProcess();
        const resultPromise = getYouTubeMetadata('https://www.youtube.com/watch?v=abcdefghijk');
        child.stderr.emit('data', Buffer.from("ERROR: Sign in to confirm you're not a bot. Use --cookies for the authentication."));
        child.emit('close', 1);

        await expect(resultPromise).rejects.toMatchObject({
            message: 'YouTube blocked audio extraction from this server. Configure fresh YouTube cookies on the backend, then retry, or upload the audio file instead.',
            status: 502,
        });
    });
});
