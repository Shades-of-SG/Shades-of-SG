const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TEMP_DIR = path.join(__dirname, '..', 'storage', 'temp');
const YOUTUBE_URL_PATTERN = /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i;
const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const DEFAULT_YT_DLP_COMMAND = process.env.YT_DLP_PATH || 'yt-dlp';
const MAX_YOUTUBE_AUDIO_BYTES = 24 * 1024 * 1024;
const DEFAULT_COOKIE_PATH = path.join(__dirname, '..', 'cookies.txt');
const RENDER_COOKIE_PATH = '/etc/secrets/youtube-cookies.txt';

const MIME_TYPES_BY_EXTENSION = {
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    webm: 'audio/webm',
};

function getAudioExtractionConfigStatus() {
    return {
        cookiesConfigured: Boolean(getCookiePath()),
        jsRuntime: process.env.YT_DLP_JS_RUNTIME?.trim() || 'node',
        maxFileSizeMb: MAX_YOUTUBE_AUDIO_BYTES / (1024 * 1024),
        tool: DEFAULT_YT_DLP_COMMAND,
    };
}

function getCookiePath() {
    const configuredPath = process.env.YT_DLP_COOKIES_PATH?.trim();
    if (configuredPath) return fsSync.existsSync(configuredPath) ? configuredPath : '';

    return [DEFAULT_COOKIE_PATH, RENDER_COOKIE_PATH].find((candidate) => fsSync.existsSync(candidate)) || '';
}

function getCommonYtDlpArgs() {
    const jsRuntime = process.env.YT_DLP_JS_RUNTIME?.trim() || 'node';
    const remoteComponent = process.env.YT_DLP_REMOTE_COMPONENT?.trim() || 'ejs:github';
    const cookiePath = getCookiePath();

    return [
        '--no-playlist',
        '--js-runtimes',
        jsRuntime,
        '--remote-components',
        remoteComponent,
        ...(cookiePath ? ['--cookies', cookiePath] : []),
    ];
}

function createYtDlpFailure(stderr, fallbackMessage) {
    const details = String(stderr || '').trim();
    let message = fallbackMessage;

    if (/sign in to confirm you.re not a bot|cookies-from-browser|cookies for the authentication/i.test(details)) {
        message = 'YouTube blocked audio extraction from this server. Configure fresh YouTube cookies on the backend, then retry, or upload the audio file instead.';
    } else if (/no supported javascript runtime|js-runtimes/i.test(details)) {
        message = 'YouTube audio extraction is missing its JavaScript runtime. Check the backend yt-dlp deployment configuration, then retry.';
    } else if (/cookie/i.test(details)) {
        message = 'The configured YouTube session has expired or is invalid. Refresh the backend YouTube cookies, then retry.';
    }

    if (details) console.error(`[yt-dlp] ${details}`);
    const extractionError = new Error(message);
    extractionError.status = 502;
    return extractionError;
}

function getYouTubeMetadata(youtubeUrl) {
  return new Promise((resolve, reject) => {
    const child = spawn(DEFAULT_YT_DLP_COMMAND, [
      ...getCommonYtDlpArgs(),
      '--dump-single-json',
      youtubeUrl,
    ], {
      windowsHide: true,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      const extractionError = new Error(
        `Unable to run yt-dlp. ${error.message}`
      )
      extractionError.status = 503
      reject(extractionError)
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(createYtDlpFailure(stderr, `YouTube metadata extraction failed with exit code ${code}.`))
        return
      }

      try {
        const data = JSON.parse(stdout)

        resolve({
          durationSecs: Math.round(Number(data.duration) || 0),
          title: String(data.title || ''),
          videoId: String(data.id || ''),
        })
      } catch {
        const extractionError = new Error(
          'Unable to read YouTube metadata.'
        )
        extractionError.status = 502
        reject(extractionError)
      }
    })
  })
}

async function extractAudioFromYouTube(youtubeUrl) {
    validateYoutubeUrl(youtubeUrl);

    const metadata = await getYouTubeMetadata(youtubeUrl);

    await fs.mkdir(TEMP_DIR, { recursive: true });

    const jobId = `youtube-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const outputTemplate = path.join(TEMP_DIR, `${jobId}.%(ext)s`);

    await runYtDlp([
        ...getCommonYtDlpArgs(),
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
        durationSecs: metadata.durationSecs,
        fileName: path.basename(extractedFile),
        filePath: extractedFile,
        mimeType: getMimeType(extractedFile),
        title: metadata.title,
        videoId: metadata.videoId,
    };
}

async function downloadMediaFromUrl(url, jobId) {
    await fs.mkdir(TEMP_DIR, { recursive: true });

    let fetchUrl = String(url || '').trim();
    if (fetchUrl.startsWith('/')) {
        const port = process.env.PORT || 5000;
        fetchUrl = `http://localhost:${port}${fetchUrl}`;
    }

    try {
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch media from ${fetchUrl}: ${response.status} ${response.statusText}`);
        }

        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        let ext = 'mp3';
        if (contentType.includes('video/mp4') || contentType.includes('audio/mp4') || fetchUrl.toLowerCase().includes('.mp4')) {
            ext = 'mp4';
        } else if (contentType.includes('audio/m4a') || fetchUrl.toLowerCase().includes('.m4a')) {
            ext = 'm4a';
        } else if (contentType.includes('webm') || fetchUrl.toLowerCase().includes('.webm')) {
            ext = 'webm';
        } else if (contentType.includes('wav') || fetchUrl.toLowerCase().includes('.wav')) {
            ext = 'wav';
        }

        const outputFileName = `${jobId}_audio.${ext}`;
        const outputPath = path.join(TEMP_DIR, outputFileName);

        const arrayBuffer = await response.arrayBuffer();
        await fs.writeFile(outputPath, Buffer.from(arrayBuffer));

        return {
            cleanup: () => removeFileQuietly(outputPath),
            fileName: outputFileName,
            filePath: outputPath,
            mimeType: getMimeType(outputPath),
        };
    } catch (err) {
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

            reject(createYtDlpFailure(stderr, `YouTube audio extraction failed with exit code ${code}.`));
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
    downloadMediaFromUrl,
    extractAudioFromYouTube,
    getAudioExtractionConfigStatus,
    getYouTubeMetadata,
};
