// backend/services/frameGenerator.js
const crypto = require('crypto')
const OpenAI = require('openai')
const aiStorageService = require('./aiStorageService')
const { SceneSegment, GeneratedFrame } = require('../models')

// Initialize OpenAI SDK
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Iterates over SceneSegments for a song, generating DALL-E 3 images sequentially.
 * Employs a cryptographic hash of the prompt to cache and reuse images for repeated choruses.
 * @param {string} songId - The UUID of the song
 */
const generateFramesForSong = async (songId) => {
  try {
    // Step 1: Fetch all SceneSegment records for this songId, ordered chronologically
    const segments = await SceneSegment.findAll({
      where: { songId },
      order: [['startTime', 'ASC']],
    })

    // Step 2: Iterate sequentially using for...of to respect OpenAI's rate limits
    for (const segment of segments) {
      if (!segment.visualPrompt) continue

      // Normalize the prompt to ensure identical prompts hash perfectly
      const normalizedPrompt = segment.visualPrompt.trim().toLowerCase()

      // THE HASHING MECHANISM:
      // We generate a SHA-256 hash of the normalized prompt string.
      // If a song repeats a chorus, the LLM generated the same exact visual prompt.
      // This hash acts as a unique fingerprint, allowing us to find matching frames and save money.
      const promptHash = crypto.createHash('sha256').update(normalizedPrompt).digest('hex')

      // Check if we've already generated an image for this exact prompt hash in this song
      const existingFrame = await GeneratedFrame.findOne({
        where: {
          songId,
          promptHash,
        },
      })

      if (existingFrame) {
        // THE CACHE HIT (Chorus / Repeated Segment)
        console.log(`[Cache Hit] Reusing frame for segment ID: ${segment.id}`)

        // Immediately map the existing Cloudinary URL to the new Segment ID
        await GeneratedFrame.create({
          songId,
          sceneSegmentId: segment.id,
          promptHash,
          imageUrl: existingFrame.imageUrl, // Reusing the permanent URL
        })
      } else {
        // THE CACHE MISS (New Segment)
        console.log(`[Cache Miss] Generating new DALL-E image for segment ID: ${segment.id}`)

        // 1. Call OpenAI DALL-E 3 API (Using original unmodified prompt text for best results)
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: segment.visualPrompt,
          n: 1,
          size: '1024x1024',
        })

        const temporaryImageUrl = response.data[0].url

        // 2. Convert and upload the temporary URL to Cloudinary permanently using our NEW service
        const permanentImageUrl = await aiStorageService.uploadImageFromUrl(temporaryImageUrl)

        // 3. Save the new GeneratedFrame record for future cache checks
        await GeneratedFrame.create({
          songId,
          sceneSegmentId: segment.id,
          promptHash,
          imageUrl: permanentImageUrl,
        })
      }
    }
  } catch (error) {
    console.error(`[Frame Generator Error for song ${songId}]:`, error)
    // FIX: Appended { cause: error } to preserve the original stack trace for ESLint
    throw new Error(`Frame generation failed: ${error.message}`, { cause: error })
  }
}

module.exports = {
  generateFramesForSong,
}
