const {
    DEFAULT_TRANSCRIPTION_MODEL,
    getTranscriptionConfigStatus,
    transcribeMediaBuffer,
} = require('../services/transcriptionService');

const originalFetch = global.fetch;
const originalApiKey = process.env.OPENAI_API_KEY;
const originalTranscriptionModel = process.env.OPENAI_TRANSCRIPTION_MODEL;

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

test('Whisper requests timestamped segments by default', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.OPENAI_TRANSCRIPTION_MODEL;
    mockSuccessfulTranscription({
        text: 'A lyric line',
        segments: [{ end: 1.5, start: 0, text: 'A lyric line' }],
    });

    const result = await transcribeTestAudio();
    const requestBody = global.fetch.mock.calls[0][1].body;

    expect(requestBody.get('model')).toBe(DEFAULT_TRANSCRIPTION_MODEL);
    expect(requestBody.get('response_format')).toBe('verbose_json');
    expect(requestBody.getAll('timestamp_granularities[]')).toEqual(['segment']);
    expect(result.model).toBe('whisper-1');
    expect(result.segments).toHaveLength(1);
    expect(getTranscriptionConfigStatus().model).toBe('gpt-4o-transcribe');
    expect(getTranscriptionConfigStatus().timingModel).toBe('whisper-1');
});

test('GPT-4o transcription uses its supported JSON format without Whisper timestamps', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    process.env.OPENAI_TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
    mockSuccessfulTranscription({ text: 'A lyric line' });

    const result = await transcribeTestAudio();
    const requestBody = global.fetch.mock.calls[0][1].body;

    expect(requestBody.get('model')).toBe('gpt-4o-transcribe');
    expect(requestBody.get('response_format')).toBe('json');
    expect(requestBody.has('timestamp_granularities[]')).toBe(false);
    expect(result.model).toBe('gpt-4o-transcribe');
    expect(result.segments).toEqual([]);
    expect(getTranscriptionConfigStatus().model).toBe('gpt-4o-transcribe');
    expect(getTranscriptionConfigStatus().timingModel).toBe('gpt-4o-transcribe');
});

test('a caller can use GPT-4o transcription without changing the Whisper timing default', async () => {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.OPENAI_TRANSCRIPTION_MODEL;
    mockSuccessfulTranscription({ text: 'A lyric line' });

    const result = await transcribeMediaBuffer({
        fileName: 'song.mp3',
        mediaBuffer: Buffer.from('test audio'),
        mimeType: 'audio/mpeg',
        model: 'gpt-4o-transcribe',
    });

    const requestBody = global.fetch.mock.calls[0][1].body;
    expect(requestBody.get('model')).toBe('gpt-4o-transcribe');
    expect(requestBody.get('response_format')).toBe('json');
    expect(result.segments).toEqual([]);
});
