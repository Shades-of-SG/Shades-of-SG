const fs = require('fs')
const path = require('path')
const axios = require('axios')
const ffmpeg = require('fluent-ffmpeg')
const { GenerationJob, Song, SceneSegment } = require('../models')
const aiStorageService = require('./aiStorageService')

// --- Helper Functions ---

/**
 * Downloads a file from a URL to a local destination
 */
async function downloadFile(url, destPath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
  })

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(destPath)
    response.data.pipe(writer)
    writer.on('finish', resolve)
    writer.on('error', reject)
  })
}

/**
 * Formats seconds into SRT timestamp format (HH:MM:SS,mmm)
 */
function formatSrtTime(seconds) {
  const date = new Date(seconds * 1000)
  const hh = String(date.getUTCHours()).padStart(2, '0')
  const mm = String(date.getUTCMinutes()).padStart(2, '0')
  const ss = String(date.getUTCSeconds()).padStart(2, '0')
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss},${ms}`
}

/**
 * Escapes a file path specifically for FFmpeg's subtitles filter
 * (Crucial for Windows paths where C:\ looks like an escape sequence)
 */
function escapePathForFFmpeg(filePath) {
  return filePath.replace(/\\/g, '/').replace(/:/g, '\\:')
}

/**
 * Safely deletes a list of files from the local filesystem
 */
async function cleanupFiles(filePaths) {
  for (const filePath of filePaths) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath)
      }
    } catch (err) {
      console.error(`Failed to delete temporary file ${filePath}:`, err.message)
    }
  }
}

// --- Main Service Logic ---

/**
 * Assembles a final MP4 video from generated scene images, audio, and lyrics.
 * * @param {number} jobId - The ID of the GenerationJob
 * @param {number} songId - The ID of the corresponding Song
 */
async function assembleVideo(jobId, songId) {
  const tempDir = path.join(__dirname, '..', 'storage', 'temp')
  const filesToCleanup = []

  let job

  try {
    // 1. Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 2. Database Fetching
    job = await GenerationJob.findByPk(jobId)
    if (!job) throw new Error(`GenerationJob ${jobId} not found`)
    if (job.status !== 'PROCESSING') {
      throw new Error(`GenerationJob ${jobId} is not in PROCESSING state`)
    }

    const song = await Song.findByPk(songId)
    if (!song) throw new Error(`Song ${songId} not found`)
    if (!song.audioUrl) throw new Error(`Song ${songId} has no audioUrl`)

    const segments = await SceneSegment.findAll({
      where: { songId },
      order: [['timestampSecs', 'ASC']],
    })

    if (!segments || segments.length === 0) {
      throw new Error(`No SceneSegments found for Song ${songId}`)
    }

    // 3. Local File Preparation (Downloading assets)
    // Download MP3
    const localMp3Path = path.join(tempDir, `audio_${jobId}.mp3`)
    filesToCleanup.push(localMp3Path)
    await downloadFile(song.audioUrl, localMp3Path)

    // Download Images & Prepare duration data
    const localImagePaths = []
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      if (!segment.imageUrl) {
        throw new Error(`SceneSegment ${segment.id} is missing an imageUrl`)
      }

      const imgPath = path.join(tempDir, `img_${jobId}_${i}.jpg`)
      filesToCleanup.push(imgPath)
      await downloadFile(segment.imageUrl, imgPath)
      localImagePaths.push(imgPath)

      // Calculate duration for this segment (default to 5 seconds for the last segment)
      const nextTimestamp = segments[i + 1]
        ? segments[i + 1].timestampSecs
        : segment.timestampSecs + 5
      segment.duration = Math.max(0, nextTimestamp - segment.timestampSecs)
    }

    // 4. SRT Subtitle Generation
    const srtPath = path.join(tempDir, `${jobId}.srt`)
    filesToCleanup.push(srtPath)
    let srtContent = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      const startTime = formatSrtTime(segment.timestampSecs)
      const endTime = formatSrtTime(segment.timestampSecs + segment.duration)

      // SRT format:
      // Index \n Start --> End \n Text \n\n
      srtContent += `${i + 1}\n`
      srtContent += `${startTime} --> ${endTime}\n`
      srtContent += `${segment.lyrics || ''}\n\n`
    }
    await fs.promises.writeFile(srtPath, srtContent, 'utf8')

    // 5. Create Concat Demuxer File for FFmpeg (To stitch images based on durations)
    const concatPath = path.join(tempDir, `concat_${jobId}.txt`)
    filesToCleanup.push(concatPath)
    let concatContent = ''

    for (let i = 0; i < segments.length; i++) {
      // FFmpeg concat demuxer expects forward slashes
      const safeImgPath = localImagePaths[i].replace(/\\/g, '/')
      concatContent += `file '${safeImgPath}'\n`
      concatContent += `duration ${segments[i].duration}\n`
    }
    // FFmpeg concat quirk: repeat the last file to ensure the final duration is respected
    concatContent += `file '${localImagePaths[localImagePaths.length - 1].replace(/\\/g, '/')}'\n`
    await fs.promises.writeFile(concatPath, concatContent, 'utf8')

    // 6. FFmpeg Compilation
    const finalMp4Path = path.join(tempDir, `${jobId}_final.mp4`)
    filesToCleanup.push(finalMp4Path)
    const escapedSrtPath = escapePathForFFmpeg(srtPath)

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatPath)
        .inputOptions(['-f concat', '-safe 0'])
        .input(localMp3Path)
        // Video Codec, frame rate, pixel format, and burn subtitles
        .outputOptions([
          '-c:v libx264',
          '-r 30',
          '-pix_fmt yuv420p',
          '-c:a aac',
          '-b:a 192k',
          '-shortest', // End video when the shortest stream (usually audio) ends
          `-vf subtitles='${escapedSrtPath}'`,
        ])
        .output(finalMp4Path)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`FFmpeg processing failed: ${err.message}`)))
        .run()
    })

    // 7. Storage Handoff (Upload to Cloudinary)
    const uploadResult = await aiStorageService.uploadCompiledVideo(finalMp4Path)

    // 8. Database Saving
    job.status = 'COMPLETED'
    job.progress = 100
    await job.save()

    song.videoUrl = uploadResult.videoUrl
    await song.save()

    // 9. Phase 5: The Cleanup Crew
    await cleanupFiles(filesToCleanup)

    return {
      success: true,
      jobId,
      videoUrl: uploadResult.videoUrl,
    }
  } catch (error) {
    // Graceful Failures (Error Boundary)
    if (job) {
      job.status = 'FAILED'
      job.errorMessage = error.message
      await job
        .save()
        .catch((dbErr) => console.error('Failed to update job status to FAILED:', dbErr))
    }

    // Trigger cleanup immediately on failure
    await cleanupFiles(filesToCleanup)

    // Throw the error up the chain to be caught by the Express controller/global error handler
    throw error
  }
}

module.exports = {
  assembleVideo,
}
