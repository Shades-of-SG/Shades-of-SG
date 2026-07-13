const { Song, User } = require('../models')
const aiStorageService = require('../services/aiStorageService')
const audioExtractionService = require('../services/audioExtractionService')
const fs = require('fs')

const uploadSong = async (req, res, next) => {
  try {
    const { title, artist, youtubeUrl, audioUrl, lyrics, rawLyrics, transcriptionSegments, theme, description } = req.body
    let creatorId = req.user ? req.user.id : null;

    if (!creatorId) {
      // Fallback: lookup seeded user to unblock development when Auth is bypassed
      const seedEmail = process.env.SEED_CREATOR_EMAIL || 'violet@shadesofsg.com';
      if (seedEmail) {
        const seedUser = await User.findOne({ where: { email: seedEmail } });
        if (seedUser) {
          creatorId = seedUser.id;
        }
      }
    }

    if (!creatorId) {
      const error = new Error('Invalid session: User does not exist. Please log in again.')
      error.statusCode = 401
      throw error
    }

    const userExists = await User.findByPk(creatorId)
    if (!userExists) {
      const error = new Error('Invalid session: User does not exist. Please log in again.')
      error.statusCode = 401
      throw error
    }

    if (!title) {
      const error = new Error('Song title is required.')
      error.statusCode = 400
      throw error
    }

    if (!req.file && !youtubeUrl && !audioUrl) {
      const error = new Error('You must provide an audio file, a YouTube URL, or an existing extracted audio URL.')
      error.statusCode = 400
      throw error
    }

    let finalAudioUrl = audioUrl; // Default to pre-extracted if provided

    // Route to the appropriate service if extraction/upload is needed
    if (req.file) {
      const audioData = await aiStorageService.uploadAudioStream(req.file.buffer)
      finalAudioUrl = audioData.audioUrl
    } else if (youtubeUrl && !audioUrl) {
      // 1. Extract the audio to a local temp file using the new service
      const extractedInfo = await audioExtractionService.extractAudioFromYouTube(youtubeUrl)

      // 2. Create a read stream from the temp file to upload to Cloudinary
      const fileStream = fs.createReadStream(extractedInfo.filePath)
      const audioData = await aiStorageService.uploadAudioStream(fileStream)
      finalAudioUrl = audioData.audioUrl

      // 3. Clean up the temp file locally
      await extractedInfo.cleanup()
    }

    let parsedSegments = null;
    if (transcriptionSegments) {
      try {
        parsedSegments = typeof transcriptionSegments === 'string' ? JSON.parse(transcriptionSegments) : transcriptionSegments;
      } catch (e) {
        console.warn('Failed to parse transcriptionSegments', e);
      }
    }

    // Save to PostgreSQL
    const newSong = await Song.create({
      creatorId,
      title,
      artist: artist || null,
      audioUrl: finalAudioUrl,
      lyrics: lyrics || null,
      rawLyrics: rawLyrics || null,
      transcriptionSegments: parsedSegments,
      theme: theme || null,
      description: description || null,
      status: 'DRAFT',
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

const extractAudio = async (req, res, next) => {
  try {
    const { youtubeUrl } = req.body
    if (!youtubeUrl) {
      const error = new Error('YouTube URL is required.')
      error.statusCode = 400
      throw error
    }

    const extractedInfo = await audioExtractionService.extractAudioFromYouTube(youtubeUrl)

    try {
      const fileStream = fs.createReadStream(extractedInfo.filePath)
      const audioData = await aiStorageService.uploadAudioStream(fileStream)

      return res.status(200).json({
        success: true,
        audioUrl: audioData.audioUrl,
      })
    } finally {
      // Must call cleanup to prevent leaking temp files on the server
      await extractedInfo.cleanup()
    }
  } catch (error) {
    next(error)
  }
}

module.exports = {
  uploadSong,
  extractAudio,
}