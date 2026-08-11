const { EventEmitter } = require('events');

const mockSpawn = jest.fn();
jest.mock('child_process', () => ({ spawn: mockSpawn }));

const fs = require('fs');

const { getCookieArgs, getYouTubeMetadata, runYtDlp } = require('../services/audioExtractionService');

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

    test('writes base64 cookies to a temporary file and uses them for metadata', async () => {
        process.env.YT_DLP_REMOTE_COMPONENT = 'ejs:github';
        process.env.YOUTUBE_COOKIES_BASE64 = Buffer.from('# Netscape HTTP Cookie File\n.youtube.com\tTRUE').toString('base64');
        const child = mockProcess();

        const resultPromise = getYouTubeMetadata('https://www.youtube.com/watch?v=abcdefghijk');
        child.stdout.emit('data', Buffer.from(JSON.stringify({ duration: 12.4, id: 'abcdefghijk', title: 'Test song' })));
        child.emit('close', 0);

        await expect(resultPromise).resolves.toEqual({ durationSecs: 12, title: 'Test song', videoId: 'abcdefghijk' });
        const cookieArgs = getCookieArgs();
        expect(cookieArgs[0]).toBe('--cookies');
        expect(fs.readFileSync(cookieArgs[1], 'utf8')).toContain('# Netscape HTTP Cookie File');
        expect(mockSpawn).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
            '--js-runtimes', 'node', '--remote-components', 'ejs:github', '--cookies', cookieArgs[1],
        ]), { windowsHide: true });
    });

    test('uses the Node runtime and cookies for audio download commands', async () => {
        process.env.YOUTUBE_COOKIES_BASE64 = Buffer.from('# Netscape HTTP Cookie File').toString('base64');
        const child = mockProcess();
        const resultPromise = runYtDlp(['--no-progress', 'https://www.youtube.com/watch?v=abcdefghijk']);
        child.emit('close', 0);

        await expect(resultPromise).resolves.toBeUndefined();
        expect(mockSpawn).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([
            '--js-runtimes', 'node', '--cookies', expect.stringMatching(/cookies\.txt$/),
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
