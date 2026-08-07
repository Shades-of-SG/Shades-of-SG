/**
 * backend/services/frameGenerator.js
 * Phase 3 of AI Video Generation Pipeline: Image Generation & Chorus Caching.
 * Orchestrates text-to-image generation for song segments using GPT Image 2 and Cloudinary.
 */

const { OpenAI } = require('openai')
const { GenerationJob, SceneSegment, GeneratedFrame } = require('../models')
const aiStorageService = require('./aiStorageService')
const cloudinary = require('../config/cloudinary')

// Initialize OpenAI client with explicit API key passing
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Aggressively normalizes a lyrics string for cache key comparison.
 * Strips section headers like [Chorus], punctuation, and collapses whitespace.
 * Exported so that controllers can derive matching chorus keys post-generation.
 *
 * @param {string} str
 * @returns {string}
 */
function normalizeCacheKey(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .toLowerCase()
    .replace(/\[.*?\]/g, '')        // Remove section headers like [Chorus]
    .replace(/[^a-z0-9\s]/g, '')    // Strip all punctuation
    .replace(/\s+/g, ' ')           // Collapse extra whitespace
    .trim()
}

/**
 * Generates a single image frame from a visual prompt string.
 * Runs GPT Image 2 first, falls back to GPT Image 1 Mini, then a static placeholder.
 * Uploads the result to Cloudinary and returns the final secure URL.
 *
 * @param {string} prompt - The visual prompt (max 4000 chars enforced internally).
 * @returns {Promise<string>} The final Cloudinary image URL.
 */
async function generateSingleFrame(prompt) {
  const safePrompt = (prompt || 'Cinematic scene').substring(0, 4000)
  let openAiImageUrl

  console.log(`[generateSingleFrame] Calling GPT Image 2...`)

  try {
    console.log(`[OpenAI] Attempting GPT Image 2 with key prefix: ${process.env.OPENAI_API_KEY?.substring(0, 7)}...`)
    const response = await openai.images.generate({
      model: 'gpt-image-2',
      prompt: safePrompt,
      size: '1792x1024',
      n: 1,
    })

    if (response.data?.[0]?.b64_json) {
      openAiImageUrl = 'data:image/png;base64,' + response.data[0].b64_json
    } else {
      openAiImageUrl = response.data?.[0]?.url || response.data?.[0]?.image_url || response.data?.[0]?.asset_url || response.data?.[0]?.link
      if (!openAiImageUrl && typeof response.data?.[0] === 'string') openAiImageUrl = response.data[0]
    }
    if (!openAiImageUrl) throw new Error(`Missing image URL in OpenAI response: ${JSON.stringify(response.data)}`)
  } catch (openaiError) {
    // Fallback to GPT Image 1 Mini on any primary failure
    console.warn(`[Fallback] GPT Image 2 failed (${openaiError.message}). Falling back to GPT Image 1 Mini.`)

    let fallbackPrompt = safePrompt.substring(0, 1000)
    if (openaiError.message.toLowerCase().includes('safety') || openaiError.message.toLowerCase().includes('rejected')) {
      console.warn(`[Safety Filter] Triggered! Replacing prompt with safe override.`)
      fallbackPrompt = 'A beautiful, peaceful, abstract cinematic visualization of music and glowing light, safe for all audiences, vibrant colors'
    }

    try {
      const fallbackResponse = await openai.images.generate({
        model: 'gpt-image-1-mini',
        prompt: fallbackPrompt,
        size: '1536x1024',
        n: 1,
      })

      if (fallbackResponse.data?.[0]?.b64_json) {
        openAiImageUrl = 'data:image/png;base64,' + fallbackResponse.data[0].b64_json
      } else {
        openAiImageUrl = fallbackResponse.data?.[0]?.url || fallbackResponse.data?.[0]?.image_url || fallbackResponse.data?.[0]?.asset_url || fallbackResponse.data?.[0]?.link
        if (!openAiImageUrl && typeof fallbackResponse.data?.[0] === 'string') openAiImageUrl = fallbackResponse.data[0]
      }
      if (!openAiImageUrl) throw new Error(`Missing image URL in OpenAI fallback response: ${JSON.stringify(fallbackResponse.data)}`)
    } catch (ultimateError) {
      console.warn(`[Ultimate Fallback] OpenAI failed completely (${ultimateError.message}). Using placeholder image.`)
      openAiImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&h=1024&fit=crop'
    }
  }

  // Cloudinary Handoff
  if (openAiImageUrl && openAiImageUrl.startsWith('data:image/')) {
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload(openAiImageUrl, {
        folder: 'shades-of-sg/frames',
        resource_type: 'image',
      }, (error, result) => {
        if (error) reject(new Error(`Cloudinary Data URI Upload Error: ${error.message}`))
        else resolve(result)
      })
    })
    return uploadResult.secure_url
  } else {
    return await aiStorageService.uploadImageFromUrl(openAiImageUrl)
  }
}

/**
 * Generates and stores frames for a specific job sequentially.
 * Uses the Chorus Cache (normalizeCacheKey deduplication) to avoid regenerating
 * identical scenes and reduce API costs.
 *
 * @param {number|string} jobId - The ID of the GenerationJob.
 * @param {number|string} songId - The ID of the song.
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
    // Stores generated Cloudinary URLs keyed by normalized lyrics/prompt.
    const imagePromptCache = new Map()

    // Pre-process and deduplicate segments based on the chorus cache key
    const uniqueGenerationTasks = new Map() // Map of cacheKey -> segment
    const segmentToCacheKey = new Map()     // Map of segment.id -> cacheKey

    for (const segment of segments) {
      const cacheKey = segment.lyrics && segment.lyrics.trim() !== ''
        ? normalizeCacheKey(segment.lyrics)
        : normalizeCacheKey(segment.visualPrompt)

      segmentToCacheKey.set(segment.id, cacheKey)

      console.log('[Cache Check] Segment ID:', segment.id, '| Key:', cacheKey)

      if (!uniqueGenerationTasks.has(cacheKey)) {
        uniqueGenerationTasks.set(cacheKey, segment)
      } else {
        console.log(`[Cache Hit] Deduplicated segment for generation: "${cacheKey.substring(0, 30)}..."`)
      }
    }

    console.log(`[Frame Generator] Optimization: Found ${uniqueGenerationTasks.size} unique scenes out of ${segments.length} segments.`)

    // 3. Generate unique frames in parallel chunks to speed things up
    const uniqueSegments = Array.from(uniqueGenerationTasks.values())
    const chunkSize = 5

    for (let i = 0; i < uniqueSegments.length; i += chunkSize) {
      const chunk = uniqueSegments.slice(i, i + chunkSize)
      console.log(`[Frame Generator] Processing chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(uniqueSegments.length / chunkSize)}...`)

      await Promise.all(chunk.map(async (segment) => {
        const cacheKey = segmentToCacheKey.get(segment.id)
        console.log(`[Cache Miss] Generating new frame for segment ${segment.id}...`)
        const finalImageUrl = await generateSingleFrame(segment.visualPrompt)
        imagePromptCache.set(cacheKey, finalImageUrl)
      }))
    }

    // 4. Database Saving
    console.log(`[Frame Generator] Saving ${segments.length} frames to database...`)
    for (const segment of segments) {
      const cacheKey = segmentToCacheKey.get(segment.id)
      const finalImageUrl = imagePromptCache.get(cacheKey)

      await GeneratedFrame.create({
        sceneSegmentId: segment.id,
        imageUrl: finalImageUrl,
      })

      segment.imageUrl = finalImageUrl
      await segment.save()
    }

    // 5. Phase Complete
    console.log(`[Phase 3 Complete] All frames generated for Job ${jobId} (Song ${songId}).`)
  } catch (error) {
    // Error Boundary
    console.error(`[Frame Generator Error] Job ${jobId} (Song ${songId}):`, error)

    if (job) {
      await job.update({
        status: 'FAILED',
        errorMessage: error.message || 'An unknown error occurred during frame generation.',
      })
    }

    // Re-throw so the orchestrator can halt the pipeline
    throw error
  }
}

module.exports = {
  generateFrames,
  generateSingleFrame,
  normalizeCacheKey,
}
