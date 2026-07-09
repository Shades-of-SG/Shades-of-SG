// backend/services/subtitleGenerator.js
const fs = require('fs').promises
const path = require('path')
const { SceneSegment } = require('../models')

/**
 * Converts float seconds (e.g., 12.5) into SRT format: HH:MM:SS,mmm
 */
const formatSrtTime = (seconds) => {
  const date = new Date(0)
  date.setUTCMilliseconds(seconds * 1000)

  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const secs = String(date.getUTCSeconds()).padStart(2, '0')
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0')

  return `${hours}:${minutes}:${secs},${ms}`
}

exports.generateSrt = async (songId, tempDirPath) => {
  const segments = await SceneSegment.findAll({
    where: { songId },
    order: [['startTime', 'ASC']],
  })

  if (!segments || segments.length === 0) {
    throw new Error('No scene segments found to generate subtitles.')
  }

  let srtContent = ''
  segments.forEach((segment, index) => {
    const sequenceNumber = index + 1
    const startTime = formatSrtTime(segment.startTime)
    const endTime = formatSrtTime(segment.endTime)

    srtContent += `${sequenceNumber}\n`
    srtContent += `${startTime} --> ${endTime}\n`
    srtContent += `${segment.lyrics}\n\n` // Blank line required
  })

  const srtPath = path.join(tempDirPath, 'subtitles.srt')
  await fs.writeFile(srtPath, srtContent, 'utf-8')

  return srtPath
}
