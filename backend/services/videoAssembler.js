const fs = require('fs')
const path = require('path')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')

// Tell fluent-ffmpeg where the FFmpeg executable is
ffmpeg.setFfmpegPath(ffmpegPath)

const {
  GenerationJob,
  Song,
  SceneSegment,
  GeneratedFrame,
} = require('../models')
const aiStorageService = require('./aiStorageService')

// --- Helper Functions ---

/**
 * Downloads a remote file to a local destination.
 *
 * @param {string} url
 * @param {string} destinationPath
 * @returns {Promise<void>}
 */
async function downloadFile(url, destinationPath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  })

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(
      destinationPath,
    )

    response.data.pipe(writer)

    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

/**
 * Converts seconds into an SRT timestamp.
 *
 * @param {number} seconds
 * @returns {string}
 */
function formatSrtTime(seconds) {
  const safeSeconds = Math.max(
    0,
    Number(seconds) || 0,
  )

  const date = new Date(
    safeSeconds * 1000,
  )

  const hours = String(
    date.getUTCHours(),
  ).padStart(2, '0')

  const minutes = String(
    date.getUTCMinutes(),
  ).padStart(2, '0')

  const wholeSeconds = String(
    date.getUTCSeconds(),
  ).padStart(2, '0')

  const milliseconds = String(
    date.getUTCMilliseconds(),
  ).padStart(3, '0')

  return `${hours}:${minutes}:${wholeSeconds},${milliseconds}`
}

/**
 * Escapes a path for FFmpeg's subtitles filter.
 *
 * @param {string} filePath
 * @returns {string}
 */
function escapePathForFFmpeg(filePath) {
  return filePath
    .replace(/\\/g, '/')
    .replace(/:/g, '\\:')
    .replace(/'/g, "\\'")
}

/**
 * Deletes temporary files without stopping the cleanup process when one fails.
 *
 * @param {string[]} filePaths
 * @returns {Promise<void>}
 */
async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
      }
    } catch (error) {
      console.error(
        `Failed to delete temporary file ${filePath}:`,
        error.message,
      )
    }
  }
}

/**
 * Returns the preferred image URL for a scene.
 *
 * @param {object} segment
 * @returns {string|null}
 */
function getSegmentImageUrl(segment) {
  if (segment.imageUrl) {
    return segment.imageUrl
  }

  const frames =
    segment.generatedFrames || []

  if (frames.length > 0) {
    const sortedFrames = [...frames].sort(
      (a, b) =>
        new Date(b.createdAt || 0)
        - new Date(a.createdAt || 0),
    )

    return (
      sortedFrames[0].imageUrl
      || sortedFrames[0].image_url
      || null
    )
  }

  return null
}

/**
 * Builds a valid subtitle file while skipping empty lyric entries.
 *
 * @param {object[]} segments
 * @returns {string}
 */
function buildSrtContent(segments) {
  let content = ''
  let subtitleIndex = 1

  segments.forEach((segment, index) => {
    const lyrics = String(
      segment.lyrics || '',
    ).trim()

    if (!lyrics) {
      return
    }

    let startSeconds = Number(
      segment.startTime,
    )

    if (
      index === 0
      && startSeconds > 0
    ) {
      startSeconds = 0
    }

    const endSeconds =
      Number(segment.startTime)
      + Number(segment.duration)

    content += `${subtitleIndex}\n`
    content += `${formatSrtTime(startSeconds)} --> ${formatSrtTime(endSeconds)}\n`
    content += `${lyrics}\n\n`

    subtitleIndex += 1
  })

  return content.trim()
}

/**
 * Assembles an MP4 from generated images, song audio and optional captions.
 *
 * The generation controller owns the final job and song lifecycle transitions.
 *
 * @param {string|number} jobId
 * @param {string|number} songId
 * @param {boolean} burnCaptions
 * @returns {Promise<{
 *   success: boolean,
 *   jobId: string|number,
 *   videoUrl: string,
 *   videoPublicId: string|null
 * }>}
 */
async function assembleVideo(
  jobId,
  songId,
  burnCaptions = true,
) {
  const tempDirectory = path.join(
    __dirname,
    '..',
    'storage',
    'temp',
  )

  const filesToCleanup = []

  try {
    await fs.promises.mkdir(
      tempDirectory,
      {
        recursive: true,
      },
    )

    const job =
      await GenerationJob.findByPk(jobId)

    if (!job) {
      throw new Error(
        `GenerationJob ${jobId} not found`,
      )
    }

    if (job.status !== 'PROCESSING') {
      throw new Error(
        `GenerationJob ${jobId} is not in PROCESSING state. Current state: ${job.status}`,
      )
    }

    const song =
      await Song.findByPk(songId)

    if (!song) {
      throw new Error(
        `Song ${songId} not found`,
      )
    }

    if (!song.audioUrl) {
      throw new Error(
        `Song ${songId} has no audioUrl`,
      )
    }

    const segments =
      await SceneSegment.findAll({
        where: {
          songId,
        },
        include: [
          {
            model: GeneratedFrame,
            as: 'generatedFrames',
            required: false,
          },
        ],
        order: [
          ['startTime', 'ASC'],
          ['id', 'ASC'],
        ],
      })

    if (segments.length === 0) {
      throw new Error(
        `No SceneSegments found for Song ${songId}`,
      )
    }

    const localAudioPath = path.join(
      tempDirectory,
      `audio_${jobId}.mp3`,
    )

    filesToCleanup.push(
      localAudioPath,
    )

    await downloadFile(
      song.audioUrl,
      localAudioPath,
    )

    const localImagePaths = []

    for (
      let index = 0;
      index < segments.length;
      index += 1
    ) {
      const segment = segments[index]

      let imageUrl =
        getSegmentImageUrl(segment)

      if (!imageUrl) {
        console.warn(
          `[videoAssembler] SceneSegment ${segment.id} has no image. Using fallback placeholder.`,
        )

        imageUrl =
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&h=1024&fit=crop'
      }

      const imagePath = path.join(
        tempDirectory,
        `image_${jobId}_${index}.jpg`,
      )

      filesToCleanup.push(imagePath)

      await downloadFile(
        imageUrl,
        imagePath,
      )

      localImagePaths.push(imagePath)

      const startTime = Number(
        segment.startTime,
      )

      const explicitEndTime = Number(
        segment.endTime,
      )

      const nextStartTime =
        index < segments.length - 1
          ? Number(
              segments[index + 1]
                .startTime,
            )
          : null

      let duration

      if (
        Number.isFinite(explicitEndTime)
        && explicitEndTime > startTime
      ) {
        duration =
          explicitEndTime - startTime
      } else if (
        Number.isFinite(nextStartTime)
        && nextStartTime > startTime
      ) {
        duration =
          nextStartTime - startTime
      } else {
        duration = 5
      }

      segment.duration = Math.max(
        0.1,
        duration,
      )
    }

    const subtitlePath = path.join(
      tempDirectory,
      `${jobId}.srt`,
    )

    filesToCleanup.push(subtitlePath)

    const subtitleContent =
      buildSrtContent(segments)

    await fs.promises.writeFile(
      subtitlePath,
      subtitleContent,
      'utf8',
    )

    const concatPath = path.join(
      tempDirectory,
      `concat_${jobId}.txt`,
    )

    filesToCleanup.push(concatPath)

    let concatContent = ''

    segments.forEach(
      (segment, index) => {
        const imagePath =
          localImagePaths[index]
            .replace(/\\/g, '/')
            .replace(/'/g, "'\\''")

        let displayDuration =
          segment.duration

        if (
          index === 0
          && Number(segment.startTime) > 0
        ) {
          displayDuration +=
            Number(segment.startTime)
        }

        concatContent +=
          `file '${imagePath}'\n`

        concatContent +=
          `duration ${displayDuration}\n`
      },
    )

    const finalImagePath =
      localImagePaths[
        localImagePaths.length - 1
      ]
        .replace(/\\/g, '/')
        .replace(/'/g, "'\\''")

    concatContent +=
      `file '${finalImagePath}'\n`

    await fs.promises.writeFile(
      concatPath,
      concatContent,
      'utf8',
    )

    const finalVideoPath = path.join(
      tempDirectory,
      `${jobId}_final.mp4`,
    )

    filesToCleanup.push(
      finalVideoPath,
    )

    const outputOptions = [
      '-c:v libx264',
      '-r 30',
      '-pix_fmt yuv420p',
      '-c:a aac',
      '-b:a 192k',
      '-shortest',
    ]

    if (
      burnCaptions
      && subtitleContent
    ) {
      const escapedSubtitlePath =
        escapePathForFFmpeg(
          subtitlePath,
        )

      outputOptions.push(
        `-vf subtitles='${escapedSubtitlePath}'`,
      )
    }

    await new Promise(
      (resolve, reject) => {
        ffmpeg()
          .input(concatPath)
          .inputOptions([
            '-f concat',
            '-safe 0',
          ])
          .input(localAudioPath)
          .outputOptions(
            outputOptions,
          )
          .output(finalVideoPath)
          .on('end', resolve)
          .on('error', (error) => {
            reject(
              new Error(
                `FFmpeg processing failed: ${error.message}`,
                {
                  cause: error,
                },
              ),
            )
          })
          .run()
      },
    )

    const uploadResult =
      await aiStorageService
        .uploadCompiledVideo(
          finalVideoPath,
          jobId,
        )

    if (
      !uploadResult
      || !uploadResult.videoUrl
    ) {
      throw new Error(
        'Compiled video upload did not return a video URL.',
      )
    }

    return {
      success: true,
      jobId,
      videoUrl:
        uploadResult.videoUrl,
      videoPublicId:
        uploadResult.videoPublicId
        || null,
    }
  } finally {
    await cleanupFiles(
      filesToCleanup,
    )
  }
}

module.exports = {
  assembleVideo,
}