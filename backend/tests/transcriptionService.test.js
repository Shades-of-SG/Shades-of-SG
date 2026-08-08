const mockWhisperCreate = jest.fn();

jest.mock('../services/whisperClient', () => ({
    getWhisperClient: jest.fn(() => ({
        audio: { transcriptions: { create: mockWhisperCreate } },
    })),
}));

const {
    DEFAULT_TRANSCRIPTION_MODEL,
    formatLyricsDraft,
    getTranscriptionConfigStatus,
    isPromptEcho,
    transcribeMediaBuffer,
} = require('../services/transcriptionService');

describe('transcription service', () => {
    const originalApiKey = process.env.OPENAI_API_KEY;
    const originalTranscriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL;

    beforeEach(() => {
        process.env.OPENAI_API_KEY = 'test-key';
        delete process.env.OPENAI_TRANSCRIPTION_MODEL;
        mockWhisperCreate.mockReset();
    });

    afterEach(() => {
        if (originalApiKey === undefined) delete process.env.OPENAI_API_KEY;
        else process.env.OPENAI_API_KEY = originalApiKey;
        if (originalTranscriptionModel === undefined) delete process.env.OPENAI_TRANSCRIPTION_MODEL;
        else process.env.OPENAI_TRANSCRIPTION_MODEL = originalTranscriptionModel;
    });

    function mockSuccessfulTranscription(responseBody) {
        mockWhisperCreate.mockResolvedValue(responseBody);
    }

    async function transcribeTestAudio() {
        return transcribeMediaBuffer({
            fileName: 'song.mp3',
            mediaBuffer: Buffer.from('test audio'),
            mimeType: 'audio/mpeg',
        });
    }

    test('requests timestamped Whisper segments with the supported SDK shape', async () => {
        mockSuccessfulTranscription({
            text: 'A lyric line',
            segments: [{ end: 1.5, start: 0, text: 'A lyric line' }],
        });

        const result = await transcribeTestAudio();
        const request = mockWhisperCreate.mock.calls[0][0];

        expect(request.model).toBe(DEFAULT_TRANSCRIPTION_MODEL);
        expect(request.response_format).toBe('verbose_json');
        expect(request.timestamp_granularities).toEqual(['segment']);
        expect(request.prompt).toBeUndefined();
        expect(result.model).toBe(DEFAULT_TRANSCRIPTION_MODEL);
        expect(result.segments).toHaveLength(1);
        expect(getTranscriptionConfigStatus().model).toBe(DEFAULT_TRANSCRIPTION_MODEL);
    });

    test('honors an explicitly configured transcription model', async () => {
        process.env.OPENAI_TRANSCRIPTION_MODEL = 'whisper-1';
        mockSuccessfulTranscription({ text: 'A lyric line', segments: [] });

        const result = await transcribeTestAudio();
        expect(mockWhisperCreate.mock.calls[0][0].model).toBe('whisper-1');
        expect(result.model).toBe('whisper-1');
        expect(result.segments).toEqual([]);
    });

    test('maps provider failures without exposing credentials', async () => {
        mockWhisperCreate.mockRejectedValue(Object.assign(new Error('rate limited'), { status: 429 }));
        await expect(transcribeTestAudio()).rejects.toMatchObject({ message: 'rate limited', status: 429 });
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
