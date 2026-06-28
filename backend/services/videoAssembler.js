// backend/services/videoAssembler.js
const fs = require('fs')
const fsPromises = require('fs').promises
const path = require('path')
const os = require('os')
const ffmpeg = require('fluent-ffmpeg')
const { Song, SceneSegment, GeneratedFrame } = require('../models')
const subtitleGenerator = require('./subtitleGenerator')
const aiStorageService = require('./aiStorageService') // Using your dedicated service

const downloadFile = async (url, destPath) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to fetch URL: ${url}`)
  const arrayBuffer = await response.arrayBuffer()
  await fsPromises.writeFile(destPath, Buffer.from(arrayBuffer))
}

exports.assembleVideo = async (songId) => {
  // Step 1: Create a unique temporary directory
  const tempDirPath = path.join(os.tmpdir(), `shades_of_sg_temp_${songId}_${Date.now()}`)

  try {
    fs.mkdirSync(tempDirPath, { recursive: true })

    // Step 2: Data Fetching
    const song = await Song.findByPk(songId)
    if (!song || !song.audioUrl) throw new Error('Song or audio track missing.')

    const segments = await SceneSegment.findAll({
      where: { songId },
      include: [{ model: GeneratedFrame }],
      order: [['startTime', 'ASC']],
    })

    if (!segments || segments.length === 0) throw new Error('No segments found for video assembly.')

    // Step 3: Downloading Audio & Images
    const audioFilePath = path.join(tempDirPath, 'audio.mp3')
    await downloadFile(song.audioUrl, audioFilePath)

    let concatFileContent = ''

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]
      // Note: Depending on your Sequelize setup, it might be segment.GeneratedFrames[0] (hasMany)
      // or segment.GeneratedFrame (hasOne). Adjust below if necessary!
      const frameUrl = segment.GeneratedFrame?.imageUrl
      if (!frameUrl) throw new Error(`Missing generated frame for segment ${segment.id}`)

      const imgFilename = `img_${String(i).padStart(3, '0')}.jpg`
      const imgPath = path.join(tempDirPath, imgFilename)

      await downloadFile(frameUrl, imgPath)

      const duration = segment.endTime - segment.startTime
      concatFileContent += `file '${imgFilename}'\n`
      concatFileContent += `duration ${duration}\n`
    }

    // Explicitly repeat the last image to prevent premature dropout in FFmpeg concat
    const lastImgFilename = `img_${String(segments.length - 1).padStart(3, '0')}.jpg`
    concatFileContent += `file '${lastImgFilename}'\n`

    const concatFilePath = path.join(tempDirPath, 'concat.txt')
    await fsPromises.writeFile(concatFilePath, concatFileContent, 'utf-8')

    // Step 4: Subtitles
    const srtPath = await subtitleGenerator.generateSrt(songId, tempDirPath)

    // Step 5: FFmpeg Compilation
    const outputFilePath = path.join(tempDirPath, 'output.mp4')
    // Escape for filtergraph compatibility (especially on Windows)
    const escapedSrtPath = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:')

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(concatFilePath)
        .inputOptions(['-f concat', '-safe 0'])
        .input(audioFilePath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-pix_fmt yuv420p', `-vf subtitles=${escapedSrtPath}`])
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(outputFilePath)
    })

    // Step 6: Upload & Update
    const finalVideoUrl = await aiStorageService.uploadCompiledVideo(outputFilePath)

    await song.update({
      videoUrl: finalVideoUrl,
      status: 'PUBLISHED',
    })

    return finalVideoUrl
  } catch (error) {
    console.error(`Assembly Failed for Song ${songId}:`, error)
    throw error
  } finally {
    // Step 7: STRICT Cleanup - This will run even if FFmpeg throws an error.
    if (fs.existsSync(tempDirPath)) {
      fs.rmSync(tempDirPath, { recursive: true, force: true })
    }
  }
}
