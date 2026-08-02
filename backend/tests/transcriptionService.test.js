const {
    DEFAULT_TRANSCRIPTION_MODEL,
    formatLyricsDraft,
    getTranscriptionConfigStatus,
    isPromptEcho,
    transcribeMediaBuffer,
} = require('../services/transcriptionService');

describe('transcription service', () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalFetch = global.fetch;
    const originalTranscriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL;

    beforeEach(() => {
        process.env.OPENAI_API_KEY = 'test-key';
        delete process.env.OPENAI_TRANSCRIPTION_MODEL;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalApiKey;
        if (originalTranscriptionModel === undefined) delete process.env.OPENAI_TRANSCRIPTION_MODEL;
        else process.env.OPENAI_TRANSCRIPTION_MODEL = originalTranscriptionModel;
    });

    function mockSuccessfulTranscription(responseBody) {
        global.fetch = jest.fn().mockResolvedValue({
            json: jest.fn().mockResolvedValue(responseBody),
            ok: true,
            status: 200,
        });
    }

    async function transcribeTestAudio() {
        return transcribeMediaBuffer({
            fileName: 'song.mp3',
            mediaBuffer: Buffer.from('test audio'),
            mimeType: 'audio/mpeg',
        });
    }

    test('requests timestamped segments without sending the old lyric prompt', async () => {
        mockSuccessfulTranscription({
            text: 'A lyric line',
            segments: [{ end: 1.5, start: 0, text: 'A lyric line' }],
        });

        const result = await transcribeTestAudio();
        const requestBody = global.fetch.mock.calls[0][1].body;

        expect(requestBody.get('model')).toBe(DEFAULT_TRANSCRIPTION_MODEL);
        expect(requestBody.get('response_format')).toBe('verbose_json');
        expect(requestBody.getAll('timestamp_granularities[]')).toEqual(['segment']);
        expect(requestBody.has('prompt')).toBe(false);
        expect(result.model).toBe(DEFAULT_TRANSCRIPTION_MODEL);
        expect(result.segments).toHaveLength(1);
        expect(getTranscriptionConfigStatus().model).toBe(DEFAULT_TRANSCRIPTION_MODEL);
    });

    test('honors an explicitly configured transcription model', async () => {
        process.env.OPENAI_TRANSCRIPTION_MODEL = 'whisper-1';
        mockSuccessfulTranscription({ text: 'A lyric line', segments: [] });

        const result = await transcribeTestAudio();
        const requestBody = global.fetch.mock.calls[0][1].body;

        expect(requestBody.get('model')).toBe('whisper-1');
        expect(result.model).toBe('whisper-1');
        expect(result.segments).toEqual([]);
        expect(getTranscriptionConfigStatus().model).toBe('whisper-1');
    });

    test('rejects a transcription that only echoes the old prompt', async () => {
        const echoed = Array(4).fill(
            'Preserve repeated choruses, repeated phrases, ad-libs, and line breaks as much as possible.'
        ).join('\n');
        mockSuccessfulTranscription({ text: echoed });

        await expect(transcribeTestAudio()).rejects.toMatchObject({ status: 422 });
        expect(isPromptEcho(echoed)).toBe(true);
    });

    test('preserves legitimate repeated lyric lines', () => {
        const lyrics = ['Stay with me', 'Stay with me', 'Oh, oh', 'Oh, oh', 'We are home'].join('\n');
        expect(isPromptEcho(lyrics)).toBe(false);
        expect(formatLyricsDraft(lyrics)).toBe(lyrics);
    });
});
