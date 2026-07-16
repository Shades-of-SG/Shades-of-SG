/**
 * backend/services/frameGenerator.js
 * * Phase 3 of AI Video Generation Pipeline: Image Generation & Chorus Caching.
 * Orchestrates text-to-image generation for song segments using DALL-E 3 and Cloudinary.
 */

const { GenerationJob, SceneSegment, GeneratedFrame } = require('../models')
const aiStorageService = require('./aiStorageService')
const { getOpenAIClient } = require('./openaiClient')

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
    // SceneSegment is keyed by songId (not jobId) — use the songId passed from the pipeline
    const segments = await SceneSegment.findAll({
      where: { songId },
      order: [['startTime', 'ASC']],
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

      // Key the cache by the normalized lyrics (if available) to ensure repeating choruses hit the cache
      const cacheKey = segment.lyrics ? segment.lyrics.trim().toLowerCase() : segment.visualPrompt

      // Check if we already generated an image for this exact lyric/prompt (e.g., a repeated chorus)
      if (imagePromptCache.has(cacheKey)) {
        // Cache HIT: Skip DALL-E and reuse the permanent Cloudinary URL
        console.log(
          `[Cache Hit] Reusing frame for segment: "${cacheKey.substring(0, 30)}..."`
        )
        finalImageUrl = imagePromptCache.get(cacheKey)
      } else {
        // Cache MISS: Generate via DALL-E 3
        console.log(`[Cache Miss] Generating new DALL-E frame for segment ${segment.id}...`)

        // 3. DALL-E Integration with Fallback
        let openAiImageUrl
        try {
          const response = await getOpenAIClient().images.generate({
            model: 'dall-e-3',
            prompt: segment.visualPrompt,
            size: '1024x1024',
            n: 1,
          })
          openAiImageUrl = response.data[0].url
        } catch (openaiError) {
          // Fallback to DALL-E 2 if DALL-E 3 is unavailable (Tier 0) or hits a 400 error
          let fallbackResponse
          try {
            if (openaiError.status === 400 || openaiError.status === 404 || openaiError.code === 'model_not_found') {
              console.warn(`[Fallback] DALL-E 3 failed (${openaiError.message}). Falling back to DALL-E 2 for segment ${segment.id}.`)
              fallbackResponse = await getOpenAIClient().images.generate({
                model: 'dall-e-2',
                prompt: segment.visualPrompt,
                size: '512x512',
                n: 1,
              })
              openAiImageUrl = fallbackResponse.data[0].url
            } else {
              throw openaiError
            }
            if (!openAiImageUrl) throw new Error(`Missing image URL in OpenAI fallback response: ${JSON.stringify(fallbackResponse.data)}`, { cause: openaiError });
          } catch (ultimateError) {
            console.warn(`[Ultimate Fallback] OpenAI generation failed completely (${ultimateError.message}). Using placeholder image to prevent FFmpeg crash.`)
            openAiImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&h=1024&fit=crop'
            
            // Explicitly assign the fallback URL and persist to DB as requested
            segment.imageUrl = openAiImageUrl
            await segment.save()
          }
        }

        // 4. Cloudinary Handoff
        // Immediately upload to persistent storage before the OpenAI URL expires
        finalImageUrl = await aiStorageService.uploadImageFromUrl(openAiImageUrl)

        // Cache the newly acquired permanent URL for future segments
        imagePromptCache.set(cacheKey, finalImageUrl)
      }

      // 5. Database Saving
      // Record the generated frame mapping to the specific segment
      await GeneratedFrame.create({
        sceneSegmentId: segment.id,
        imageUrl: finalImageUrl,
      })

      // Sync the Cloudinary final URL back to the segment's imageUrl column and save
      segment.imageUrl = finalImageUrl
      await segment.save()
    }

    // 6. Phase Complete
    console.log(
      `[Phase 3 Complete] All frames generated for Job ${jobId} (Song ${songId}).`
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
