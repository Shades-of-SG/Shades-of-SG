const {
    formatLyricsDraft,
    isPromptEcho,
    transcribeMediaBuffer,
} = require('../services/transcriptionService');

describe('transcription service', () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalFetch = global.fetch;

    beforeEach(() => {
        process.env.OPENAI_API_KEY = 'test-key';
    });

    afterEach(() => {
        global.fetch = originalFetch;
        if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalApiKey;
    });

    test('rejects a transcription that only echoes the old prompt', async () => {
        const echoed = Array(4).fill(
            'Preserve repeated choruses, repeated phrases, ad-libs, and line breaks as much as possible.'
        ).join('\n');
        global.fetch = jest.fn().mockResolvedValue({
            json: async () => ({ text: echoed }),
            ok: true,
        });

        await expect(transcribeMediaBuffer({
            fileName: 'song.mp4',
            mediaBuffer: Buffer.from('media'),
            mimeType: 'video/mp4',
        })).rejects.toMatchObject({ status: 422 });

        const requestBody = global.fetch.mock.calls[0][1].body;
        expect(requestBody.has('prompt')).toBe(false);
        expect(isPromptEcho(echoed)).toBe(true);
    });

    test('preserves legitimate repeated lyric lines', () => {
        const lyrics = ['Stay with me', 'Stay with me', 'Oh, oh', 'Oh, oh', 'We are home'].join('\n');
        expect(isPromptEcho(lyrics)).toBe(false);
        expect(formatLyricsDraft(lyrics)).toBe(lyrics);
    });
});
