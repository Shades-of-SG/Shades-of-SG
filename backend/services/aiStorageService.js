// backend/services/aiStorageService.js
const cloudinary = require('../config/cloudinary')
const { Readable } = require('stream')

/**
 * (PHASE 1) Uploads an audio stream (File Buffer or URL pipe) to Cloudinary
 */
const uploadAudioStream = (fileData) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // Mandated by Cloudinary for audio
        folder: 'shades-of-sg/audio',
      },
      (error, result) => {
        if (error) {
          // Properly forwarding the cause to satisfy ESLint
          return reject(
            new Error(`Cloudinary Audio Upload Error: ${error.message}`, { cause: error })
          )
        }
        resolve({
          audioUrl: result.secure_url,
          duration: Math.round(result.duration || 0),
        })
      }
    )

    if (Buffer.isBuffer(fileData)) {
      Readable.from(fileData).pipe(uploadStream)
    } else if (fileData && typeof fileData.pipe === 'function') {
      fileData.pipe(uploadStream)
    } else {
      reject(new Error('Invalid file data provided.'))
    }
  })
}

/**
 * (PHASE 3) Fetches an image from a temporary URL and uploads it to Cloudinary as a Buffer stream.
 * @param {string} imageUrl - The temporary URL from OpenAI DALL-E 3
 * @returns {Promise<string>} The permanent Cloudinary secure_url
 */
const uploadImageFromUrl = async (imageUrl) => {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from DALL-E URL: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // We MUST await the promise here so the outer try/catch can grab any rejections
    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shades-of-sg/frames', // Standardized the folder name to use dashes
          resource_type: 'image',
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary Image Upload Error: ${error.message}`, { cause: error }))
          } else {
            resolve(result.secure_url)
          }
        }
      )

      // Using Readable.pipe() instead of .end() satisfies the IDE's method resolution
      // and keeps our stream logic 100% consistent with Phase 1.
      Readable.from(buffer).pipe(uploadStream)
    })
  } catch (error) {
    // Appending { cause: error } preserves the original stack trace for the linter
    throw new Error(`Error in aiStorageService: ${error.message}`, { cause: error })
  }
}

module.exports = {
  uploadAudioStream,
  uploadImageFromUrl,
}
