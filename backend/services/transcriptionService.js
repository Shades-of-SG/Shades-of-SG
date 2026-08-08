const { toFile } = require('openai');
const { getWhisperClient } = require('./whisperClient');

const MAX_TRANSCRIPTION_BYTES = 25 * 1024 * 1024;
const DEFAULT_TRANSCRIPTION_MODEL = 'whisper-1';
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
    const whisper = getWhisperClient();

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

    const file = await toFile(mediaBuffer, fileName, { type: normalizedMimeType });
    let responseBody;
    try {
        responseBody = await whisper.audio.transcriptions.create({
            file,
            model: process.env.OPENAI_TRANSCRIPTION_MODEL || DEFAULT_TRANSCRIPTION_MODEL,
            response_format: 'verbose_json',
            timestamp_granularities: ['segment'],
        });
    } catch (cause) {
        const error = new Error(cause?.message || 'Unable to transcribe media.', { cause });
        error.status = Number(cause?.status || cause?.statusCode) || 502;
        throw error;
    }

    const rawLyrics = String(responseBody.text || '').trim();
    if (!rawLyrics || isPromptEcho(rawLyrics)) {
        const error = new Error('No usable vocals were detected. Try a clearer audio track with less silence or instrumental-only content.');
        error.status = 422;
        throw error;
    }

    const formattedLyrics = responseBody.segments && responseBody.segments.length > 0
        ? responseBody.segments
            .map(s => s.text.trim())
            .filter(Boolean)
            .join('\n')
        : formatLyricsDraft(rawLyrics);

    return {
        lyrics: formattedLyrics,
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

/**
 * Re-compiles and syncs song.transcriptionSegments from all current SceneSegment records for a given song.
 * Ensures public captions (e.g. in SongExperience) stay live-synced with edited lyrics and atomic blocks.
 *
 * @param {number|string} songId
 */
async function syncSongTranscriptionSegments(songId) {
    const { Song, SceneSegment } = require('../models');
    const song = await Song.findByPk(songId);
    if (!song) return;

    const sceneSegments = await SceneSegment.findAll({
        where: { songId },
        order: [['startTime', 'ASC']],
    });

    if (!sceneSegments || sceneSegments.length === 0) return;

    const newTranscriptionSegments = [];

    for (const seg of sceneSegments) {
        if (Array.isArray(seg.blocks) && seg.blocks.length > 0) {
            for (const b of seg.blocks) {
                newTranscriptionSegments.push({
                    id: b.id || `block_${b.startTime}_${b.endTime}`,
                    start: Number(b.startTime),
                    end: Number(b.endTime),
                    startTime: Number(b.startTime),
                    endTime: Number(b.endTime),
                    text: (b.text || b.lyrics || '').trim(),
                    lyrics: (b.text || b.lyrics || '').trim(),
                });
            }
        } else {
            const rawLyrics = (seg.lyrics || '').trim();
            const lines = rawLyrics.split('\n').map(l => l.trim()).filter(Boolean);
            if (lines.length > 1) {
                const totalDuration = Math.max(0.1, seg.endTime - seg.startTime);
                const lineDuration = totalDuration / lines.length;
                lines.forEach((line, idx) => {
                    const st = Number((seg.startTime + (idx * lineDuration)).toFixed(2));
                    const et = idx === lines.length - 1 ? seg.endTime : Number((seg.startTime + ((idx + 1) * lineDuration)).toFixed(2));
                    newTranscriptionSegments.push({
                        id: `seg_${seg.id}_${idx}`,
                        start: st,
                        end: et,
                        startTime: st,
                        endTime: et,
                        text: line,
                        lyrics: line,
                    });
                });
            } else {
                newTranscriptionSegments.push({
                    id: seg.id,
                    start: Number(seg.startTime),
                    end: Number(seg.endTime),
                    startTime: Number(seg.startTime),
                    endTime: Number(seg.endTime),
                    text: rawLyrics,
                    lyrics: rawLyrics,
                });
            }
        }
    }

    song.transcriptionSegments = newTranscriptionSegments;
    song.changed('transcriptionSegments', true);
    await song.save();
    return newTranscriptionSegments;
}

module.exports = {
    DEFAULT_TRANSCRIPTION_MODEL,
    formatLyricsDraft,
    getTranscriptionConfigStatus,
    MAX_TRANSCRIPTION_BYTES,
    isPromptEcho,
    normalizeMimeType,
    syncSongTranscriptionSegments,
    transcribeMedia,
    transcribeMediaBuffer,
};

