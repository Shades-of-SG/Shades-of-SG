const ytdl = require('ytdl-core')
const cloudinaryService = require('./cloudinaryService')

/**
 * Downloads audio from a YouTube URL and uploads it to Cloudinary.
 * @param {string} youtubeUrl
 * @returns {Promise<{audioUrl: string, duration: number}>}
 */
const processYouTubeAudio = async (youtubeUrl) => {
  if (!ytdl.validateURL(youtubeUrl)) {
    const error = new Error('Invalid or unsupported YouTube URL provided.')
    error.statusCode = 400 // Matches your errorHandler.js
    throw error
  }

  try {
    const audioStream = ytdl(youtubeUrl, {
      filter: 'audioonly',
      quality: 'highestaudio',
    })

    // Pipe directly to our cloudinary service
    const cloudinaryResult = await cloudinaryService.uploadAudioStream(audioStream)

    return cloudinaryResult
  } catch (err) {
    const customError = new Error(`YouTube Processing Failed: ${err.message}`)
    customError.statusCode = 502
    throw customError
  }
}

module.exports = {
  processYouTubeAudio,
}
