const OPENAI_TRANSCRIPTION_URL = 'https://api.openai.com/v1/audio/transcriptions';
const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-transcribe';
const PROMPT_ECHO_TEXT = 'Preserve repeated choruses, repeated phrases, ad-libs, and line breaks as much as possible.';

const SUPPORTED_MIME_TYPES = new Set([
    'audio/m4a',
    'audio/mpeg',
    'audio/mp3',
    'audio/mp4',
    'audio/mpga',
    'audio/webm',
    'audio/wav',
    'audio/x-wav',
    'video/webm',
    'video/mp4',
]);

const MIME_TYPES_BY_EXTENSION = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mpeg: 'audio/mpeg',
    mpga: 'audio/mpeg',
    wav: 'audio/wav',
    webm: 'audio/webm',
};

function normalizeMimeType(fileName, mimeType) {
    if (mimeType && SUPPORTED_MIME_TYPES.has(mimeType)) {
        return mimeType;
    }

    const extension = String(fileName || '').toLowerCase().split('.').pop();
    return MIME_TYPES_BY_EXTENSION[extension] || mimeType;
}

function getTranscriptionConfigStatus() {
    return {
        configured: Boolean(process.env.OPENAI_API_KEY),
        maxFileSizeMb: MAX_TRANSCRIPTION_BYTES / (1024 * 1024),
        model: process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL,
        supportedMimeTypes: Array.from(SUPPORTED_MIME_TYPES).sort(),
    };
}

async function transcribeMedia({ fileName, mediaBase64, mimeType }) {
    if (!process.env.OPENAI_API_KEY) {
        const error = new Error('OpenAI transcription is not configured.');
        error.status = 503;
        throw error;
    }

    if (!mediaBase64 || !fileName || !mimeType) {
        const error = new Error('A media file, file name, and MIME type are required.');
        error.status = 400;
        throw error;
    }

    const normalizedMimeType = normalizeMimeType(fileName, mimeType);

    if (!SUPPORTED_MIME_TYPES.has(normalizedMimeType)) {
        const error = new Error('Unsupported media type. Upload MP3, WAV, M4A, WEBM, or MP4 media.');
        error.status = 400;
        throw error;
    }

    const mediaBuffer = Buffer.from(mediaBase64, 'base64');

    return transcribeMediaBuffer({ fileName, mediaBuffer, mimeType });
}

async function transcribeMediaBuffer({ fileName, mediaBuffer, mimeType }) {
    if (!process.env.OPENAI_API_KEY) {
        const error = new Error('OpenAI transcription is not configured.');
        error.status = 503;
        throw error;
    }

    if (!mediaBuffer || !fileName || !mimeType) {
        const error = new Error('A media file, file name, and MIME type are required.');
        error.status = 400;
        throw error;
    }

    const normalizedMimeType = normalizeMimeType(fileName, mimeType);

    if (!SUPPORTED_MIME_TYPES.has(normalizedMimeType)) {
        const error = new Error('Unsupported media type. Upload MP3, WAV, M4A, WEBM, or MP4 media.');
        error.status = 400;
        throw error;
    }

    if (mediaBuffer.byteLength > MAX_TRANSCRIPTION_BYTES) {
        const error = new Error('Transcription files must be 25MB or smaller.');
        error.status = 413;
        throw error;
    }

    const formData = new FormData();
    formData.append('model', process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL);
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'segment');
    formData.append('file', new Blob([mediaBuffer], { type: normalizedMimeType }), fileName);

    const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
    });

    const responseBody = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(responseBody?.error?.message || 'Unable to transcribe media.');
        error.status = response.status;
        throw error;
    }

    const rawLyrics = String(responseBody.text || '').trim();
    if (!rawLyrics || isPromptEcho(rawLyrics)) {
        const error = new Error('No usable vocals were detected. Try a clearer audio track with less silence or instrumental-only content.');
        error.status = 422;
        throw error;
    }

    return {
        lyrics: formatLyricsDraft(rawLyrics),
        rawLyrics,
        segments: responseBody.segments || [],
        model: process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL,
    };
}

function isPromptEcho(text) {
    const normalizedText = String(text || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const normalizedPrompt = PROMPT_ECHO_TEXT.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (!normalizedText || !normalizedPrompt) return false;
    const withoutPrompt = normalizedText.split(normalizedPrompt).join('').trim();
    const occurrences = normalizedText.split(normalizedPrompt).length - 1;
    return occurrences >= 1 && !withoutPrompt;
}

function formatLyricsDraft(text) {
    const normalizedText = String(text || '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    if (!normalizedText) {
        return '';
    }

    const existingLines = normalizedText.split('\n').filter(Boolean);

    if (existingLines.length > 4) {
        return normalizedText;
    }

    const words = normalizedText.split(' ');
    const lines = [];
    let currentLine = [];

    words.forEach((word) => {
        if (shouldStartNewLine(word, currentLine)) {
            pushLine(lines, currentLine);
            currentLine = [];
        }

        currentLine.push(word);

        if (shouldEndLine(word, currentLine)) {
            pushLine(lines, currentLine);
            currentLine = [];
        }
    });

    pushLine(lines, currentLine);

    return groupLinesIntoStanzas(lines);
}

function shouldStartNewLine(word, currentLine) {
    if (currentLine.length < 4) {
        return false;
    }

    const normalizedWord = word.toLowerCase().replace(/^[^a-z']+|[^a-z']+$/g, '');
    const phraseStarters = new Set([
        'and',
        'baby',
        'but',
        "can't",
        'cause',
        "'cause",
        'i',
        "i'd",
        "i'll",
        "i'm",
        "i've",
        'if',
        'meet',
        'oh',
        'since',
        'so',
        'then',
        'we',
        "we're",
        'when',
        'where',
        'you',
        "you're",
    ]);

    return phraseStarters.has(normalizedWord);
}

function shouldEndLine(word, currentLine) {
    if (currentLine.length >= 11) {
        return true;
    }

    if (currentLine.length >= 5 && /[.!?]$/.test(word)) {
        return true;
    }

    return currentLine.length >= 7 && /[,;:]$/.test(word);
}

function pushLine(lines, currentLine) {
    const line = currentLine.join(' ').trim();

    if (line) {
        lines.push(line);
    }
}

function groupLinesIntoStanzas(lines) {
    return lines
        .reduce((stanzas, line, index) => {
            stanzas.push(line);

            if ((index + 1) % 4 === 0 && index !== lines.length - 1) {
                stanzas.push('');
            }

            return stanzas;
        }, [])
        .join('\n');
}

module.exports = {
    DEFAULT_TRANSCRIPTION_MODEL,
    formatLyricsDraft,
    getTranscriptionConfigStatus,
    MAX_TRANSCRIPTION_BYTES,
    isPromptEcho,
    normalizeMimeType,
    transcribeMedia,
    transcribeMediaBuffer,
};
