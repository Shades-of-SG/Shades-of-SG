const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const TEMP_DIR = path.join(__dirname, '..', 'storage', 'temp');
const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i;
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const DEFAULT_YT_DLP_COMMAND = process.env.YT_DLP_PATH || 'yt-dlp';
const MAX_YOUTUBE_AUDIO_BYTES = 24 * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    webm: 'audio/webm',
};

function getAudioExtractionConfigStatus() {
    return {
        maxFileSizeMb: MAX_YOUTUBE_AUDIO_BYTES / (1024 * 1024),
        tool: DEFAULT_YT_DLP_COMMAND,
    };
}

async function extractAudioFromYouTube(youtubeUrl) {
    validateYoutubeUrl(youtubeUrl);
    await fs.mkdir(TEMP_DIR, { recursive: true });

    const jobId = `youtube-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const outputTemplate = path.join(TEMP_DIR, `${jobId}.%(ext)s`);

    await runYtDlp([
        '--no-playlist',
        '--no-progress',
        '--max-filesize',
        `${MAX_YOUTUBE_AUDIO_BYTES}`,
        '-f',
        'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
        '-o',
        outputTemplate,
        youtubeUrl,
    ]);

    const extractedFile = await findExtractedFile(jobId);

    if (!extractedFile) {
        const error = new Error('YouTube audio extraction completed without producing an audio file.');
        error.status = 502;
        throw error;
    }

    const stats = await fs.stat(extractedFile);

    if (stats.size > MAX_YOUTUBE_AUDIO_BYTES) {
        await removeFileQuietly(extractedFile);
        const error = new Error('Extracted YouTube audio is too large for AI transcription.');
        error.status = 413;
        throw error;
    }

    return {
        cleanup: () => removeFileQuietly(extractedFile),
        fileName: path.basename(extractedFile),
        filePath: extractedFile,
        mimeType: getMimeType(extractedFile),
    };
}

async function downloadMediaFromUrl(url, jobId) {
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    // Default to .mp3, but check URL for common extensions
    let ext = 'mp3';
    if (url.toLowerCase().includes('.mp4')) ext = 'mp4';
    else if (url.toLowerCase().includes('.m4a')) ext = 'm4a';
    else if (url.toLowerCase().includes('.webm')) ext = 'webm';
    else if (url.toLowerCase().includes('.wav')) ext = 'wav';

    const outputFileName = `${jobId}_audio.${ext}`;
    const outputPath = path.join(TEMP_DIR, outputFileName);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch media from ${url}: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

        return {
            cleanup: () => removeFileQuietly(outputPath),
            fileName: outputFileName,
            filePath: outputPath,
            mimeType: getMimeType(outputPath),
        };
    } catch (err) {
        await removeFileQuietly(outputPath);
        const error = new Error(`Direct media download failed: ${err.message}`);
        error.status = 502;
        throw error;
    }
}

function validateYoutubeUrl(youtubeUrl) {
    if (!youtubeUrl || !YOUTUBE_URL_PATTERN.test(youtubeUrl)) {
        const error = new Error('A valid YouTube URL is required for server-side audio extraction.');
        error.status = 400;
        throw error;
    }

    const videoId = getYoutubeVideoId(youtubeUrl);

    if (!videoId || !YOUTUBE_ID_PATTERN.test(videoId)) {
        const error = new Error('The YouTube link looks incomplete. Paste the full YouTube URL with an 11-character video ID.');
        error.status = 400;
        throw error;
    }
}

function getYoutubeVideoId(youtubeUrl) {
    try {
        const url = new URL(youtubeUrl);

        if (url.hostname.includes('youtu.be')) {
            return url.pathname.split('/').filter(Boolean)[0];
        }

        return url.searchParams.get('v');
    } catch {
        return '';
    }
}

function runYtDlp(args) {
    return new Promise((resolve, reject) => {
        const process = spawn(DEFAULT_YT_DLP_COMMAND, args, {
            windowsHide: true,
        });
        let stderr = '';

        process.stderr.on('data', (chunk) => {
            stderr += chunk.toString();
        });

        process.on('error', (error) => {
            const extractionError = new Error(
                `Unable to run yt-dlp. Install yt-dlp or set YT_DLP_PATH in backend/.env. ${error.message}`
            );
            extractionError.status = 503;
            reject(extractionError);
        });

        process.on('close', (code) => {
            if (code === 0) {
                resolve();
                return;
            }

            const extractionError = new Error(
                stderr.trim() || `YouTube audio extraction failed with exit code ${code}.`
            );
            extractionError.status = 502;
            reject(extractionError);
        });
    });
}

async function findExtractedFile(jobId) {
    const files = await fs.readdir(TEMP_DIR);
    const fileName = files.find((name) => name.startsWith(`${jobId}.`));

    return fileName ? path.join(TEMP_DIR, fileName) : null;
}

function getMimeType(filePath) {
    const extension = path.extname(filePath).slice(1).toLowerCase();
    return MIME_TYPES_BY_EXTENSION[extension] || 'audio/mpeg';
}

async function removeFileQuietly(filePath) {
    await fs.unlink(filePath).catch(() => {});
}

module.exports = {
    extractAudioFromYouTube,
    downloadMediaFromUrl,
    getAudioExtractionConfigStatus,
};
