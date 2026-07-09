const { Song } = require('../models')
const aiStorageService = require('../services/aiStorageService')
const audioExtractionService = require('../services/audioExtractionService')
const fs = require('fs')

const uploadSong = async (req, res, next) => {
  try {
    const { title, artist, youtubeUrl } = req.body
    // Mocking user ID until Auth is finalized to prevent breaking
    const creatorId = req.user ? req.user.id : '00000000-0000-0000-0000-000000000000'

    if (!title) {
      const error = new Error('Song title is required.')
      error.statusCode = 400
      throw error
    }

    if (!req.file && !youtubeUrl) {
      const error = new Error('You must provide either an audio file or a YouTube URL.')
      error.statusCode = 400
      throw error
    }

    let audioData

    // Route to the appropriate service
    if (req.file) {
      audioData = await aiStorageService.uploadAudioStream(req.file.buffer)
    } else if (youtubeUrl) {
      // 1. Extract the audio to a local temp file using the new service
      const extractedInfo = await audioExtractionService.extractAudioFromYouTube(youtubeUrl)

      // 2. Create a read stream from the temp file to upload to Cloudinary
      const fileStream = fs.createReadStream(extractedInfo.filePath)
      audioData = await aiStorageService.uploadAudioStream(fileStream)

      // 3. Clean up the temp file locally
      await extractedInfo.cleanup()
    }

    // Save to PostgreSQL
    const newSong = await Song.create({
      creatorId,
      title,
      artist: artist || null,
      audioUrl: audioData.audioUrl,
      status: 'DRAFT',

      // left out durationSecs because it does not exist in Song.js model (yet?)
    })

    return res.status(201).json({
      success: true,
      data: newSong,
    })
  } catch (error) {
    // Passes to your exact middleware/errorHandler.js
    next(error)
  }
}

module.exports = {
  uploadSong,
}