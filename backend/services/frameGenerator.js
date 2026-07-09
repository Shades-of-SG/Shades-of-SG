/**
 * backend/services/frameGenerator.js
 * * Phase 3 of AI Video Generation Pipeline: Image Generation & Chorus Caching.
 * Orchestrates text-to-image generation for song segments using DALL-E 3 and Cloudinary.
 */

const { OpenAI } = require('openai')
const { GenerationJob, SceneSegment, GeneratedFrame } = require('../models')
const aiStorageService = require('./aiStorageService')

// Initialize OpenAI client (automatically picks up process.env.OPENAI_API_KEY)
const openai = new OpenAI()

/**
 * Generates and stores frames for a specific job sequentially.
 * * @param {number|string} jobId - The ID of the GenerationJob.
 * @param {number|string} songId - The ID of the song (for context/logging).
 */
async function generateFrames(jobId, songId) {
  let job

  try {
    // 1. Database Fetching & Job Validation
    job = await GenerationJob.findByPk(jobId)

    if (!job) {
      throw new Error(`GenerationJob with ID ${jobId} not found.`)
    }
    if (job.status !== 'PROCESSING') {
      throw new Error(`GenerationJob is not in PROCESSING state. Current state: ${job.status}`)
    }

    // Fetch scene segments ordered chronologically
    const segments = await SceneSegment.findAll({
      where: { jobId },
      order: [['timestampSecs', 'ASC']],
    })

    if (!segments || segments.length === 0) {
      throw new Error('No SceneSegments found for this job.')
    }

    // 2. The Chorus Cache (Cost-Saving Logic)
    // Used to store generated Cloudinary URLs keyed by their exact image prompt.
    const imagePromptCache = new Map()

    // Use a for...of loop to enforce synchronous execution and avoid OpenAI rate limits
    for (const segment of segments) {
      let finalImageUrl

      // Check if we already generated an image for this exact prompt (e.g., a repeated chorus)
      if (imagePromptCache.has(segment.imagePrompt)) {
        // Cache HIT: Skip DALL-E and reuse the permanent Cloudinary URL
        console.log(
          `[Cache Hit] Reusing frame for prompt: "${segment.imagePrompt.substring(0, 30)}..."`
        )
        finalImageUrl = imagePromptCache.get(segment.imagePrompt)
      } else {
        // Cache MISS: Generate via DALL-E 3
        console.log(`[Cache Miss] Generating new DALL-E frame for segment ${segment.id}...`)

        // 3. DALL-E 3 Integration
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: segment.imagePrompt,
          size: '1024x1024',
          n: 1, // DALL-E 3 only supports generating 1 image per request
        })

        const openAiImageUrl = response.data[0].url

        // 4. Cloudinary Handoff
        // Immediately upload to persistent storage before the OpenAI URL expires
        finalImageUrl = await aiStorageService.uploadImageFromUrl(openAiImageUrl)

        // Cache the newly acquired permanent URL for future segments
        imagePromptCache.set(segment.imagePrompt, finalImageUrl)
      }

      // 5. Database Saving
      // Record the generated frame mapping to the specific segment
      await GeneratedFrame.create({
        jobId: jobId,
        sceneSegmentId: segment.id,
        imageUrl: finalImageUrl,
      })
    }

    // 6. Progress Update
    // Update job progress to 60% after all frames have been safely processed and stored
    await job.update({ progress: 60 })
    console.log(
      `[Phase 3 Complete] All frames generated for Job ${jobId} (Song ${songId}). Progress updated to 60%.`
    )
  } catch (error) {
    // 7. Error Boundaries
    console.error(`[Frame Generator Error] Job ${jobId} (Song ${songId}):`, error)

    // Update the database to reflect the failed pipeline status if the job was found
    if (job) {
      await job.update({
        status: 'FAILED',
        errorMessage: error.message || 'An unknown error occurred during frame generation.',
      })
    }

    // Throw the error upstream so the orchestrator can halt the pipeline execution
    throw error
  }
}

module.exports = {
  generateFrames,
}
