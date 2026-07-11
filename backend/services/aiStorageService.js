// backend/services/aiStorageService.js
const cloudinary = require('../config/cloudinary')
const { Readable } = require('stream')

/**
 * (PHASE 1) Uploads an audio stream (File Buffer or URL pipe) to Cloudinary
 */
const uploadAudioStream = (fileData) => {
  // ... (Your existing code untouched)
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'video', // Mandated by Cloudinary for audio
        folder: 'shades-of-sg/audio',
      },
      (error, result) => {
        if (error) {
          return reject(
            new Error(`Cloudinary Audio Upload Error: ${error.message}`, { cause: error })
          )
        }
        resolve({
          audioUrl: result.secure_url,
          audioPublicId: result.public_id,
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
 */
const uploadImageFromUrl = async (imageUrl) => {
  // ... (Your existing code untouched)
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from DALL-E URL: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    return await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'shades-of-sg/frames',
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
      Readable.from(buffer).pipe(uploadStream)
    })
  } catch (error) {
    throw new Error(`Error in aiStorageService: ${error.message}`, { cause: error })
  }
}

/**
 * (PHASE 4) Uploads a compiled MP4 video to Cloudinary from the local disk.
 * @param {string} localFilePath - The local path to the generated .mp4 file.
 * @returns {Promise<{videoUrl: string, videoPublicId: string}>} Stored video identifiers
 */
const uploadCompiledVideo = (localFilePath) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: 'video',
        folder: 'shades-of-sg/compiled-videos',
      },
      (error, result) => {
        if (error) {
          return reject(
            new Error(`Cloudinary Video Upload Error: ${error.message}`, { cause: error })
          )
        }
        resolve({
          videoUrl: result.secure_url,
          videoPublicId: result.public_id,
        })
      }
    )
  })
}

module.exports = {
  uploadAudioStream,
  uploadImageFromUrl,
  uploadCompiledVideo, // Added Phase 4 export
}
