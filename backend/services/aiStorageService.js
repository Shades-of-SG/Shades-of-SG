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
const uploadImageFromUrl = async (imageSource) => {
  // ... (Your existing code untouched)
  try {
    let buffer;
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      const response = await fetch(imageSource)
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()
      buffer = Buffer.from(arrayBuffer)
    } else {
      // Handle raw base64 string (strip data URI prefix if accidentally included)
      const base64Data = imageSource.replace(/^data:image\/\w+;base64,/, '')
      buffer = Buffer.from(base64Data, 'base64')
    }

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
 * @param {number|string} jobId - The job ID to use in the file name.
 * @returns {Promise<string>} The permanent Cloudinary secure_url
 */
const uploadCompiledVideo = (localFilePath, jobId) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      localFilePath,
      {
        resource_type: 'video',
        folder: 'shades-of-sg/compiled-videos',
        public_id: `export_job_${jobId}_${Date.now()}`
      },
      (error, result) => {
        if (error) {
          return reject(
            new Error(`Cloudinary Video Upload Error: ${error.message}`, { cause: error })
          )
        }
        resolve(result.secure_url)
      }
    )
  })
}

module.exports = {
  uploadAudioStream,
  uploadImageFromUrl,
  uploadCompiledVideo, // Added Phase 4 export
}
