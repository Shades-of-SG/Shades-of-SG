/**
 * backend/services/frameGenerator.js
 * * Phase 3 of AI Video Generation Pipeline: Image Generation & Chorus Caching.
 * Orchestrates text-to-image generation for song segments using GPT Image 2 and Cloudinary.
 */

const { OpenAI } = require('openai')
const { GenerationJob, SceneSegment, GeneratedFrame } = require('../models')
const aiStorageService = require('./aiStorageService')
const cloudinary = require('../config/cloudinary')

// Initialize OpenAI client with explicit API key passing
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

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
    if (job.status !== 'IN_PROGRESS') {
      throw new Error(`GenerationJob is not in IN_PROGRESS state. Current state: ${job.status}`)
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

    /**
     * Aggressively normalizes a lyrics string for cache key comparison.
     * Strips timestamps, section markers like [Chorus], punctuation, and collapses whitespace.
     */
    const normalizeCacheKey = (str) => {
      return str
        .toLowerCase()
        .replace(/\[.*?\]/g, '')        // Strip [Chorus], [0:30], [Instrumental], etc.
        .replace(/[^a-z0-9\s]/g, '')    // Strip all punctuation
        .replace(/\s+/g, ' ')           // Collapse multiple spaces into one
        .trim()
    }

    // 2. Pre-process and deduplicate segments based on the chorus cache key
    const uniqueGenerationTasks = new Map() // Map of cacheKey -> segment
    const segmentToCacheKey = new Map()     // Map of segment.id -> cacheKey

    for (const segment of segments) {
      const cacheKey = segment.lyrics && segment.lyrics.trim() !== ''
        ? normalizeCacheKey(segment.lyrics)
        : segment.visualPrompt
      
      segmentToCacheKey.set(segment.id, cacheKey)
      
      if (!uniqueGenerationTasks.has(cacheKey)) {
        uniqueGenerationTasks.set(cacheKey, segment)
      } else {
        console.log(`[Cache Hit] Deduplicated segment for generation: "${cacheKey.substring(0, 30)}..."`)
      }
    }

    console.log(`[Frame Generator] Optimization: Found ${uniqueGenerationTasks.size} unique scenes out of ${segments.length} segments.`)

    // 3. Generate unique frames in parallel chunks (e.g. 5 at a time) to speed things up
    const uniqueSegments = Array.from(uniqueGenerationTasks.values())
    const chunkSize = 5
    
    for (let i = 0; i < uniqueSegments.length; i += chunkSize) {
      const chunk = uniqueSegments.slice(i, i + chunkSize)
      console.log(`[Frame Generator] Processing chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(uniqueSegments.length / chunkSize)}...`)
      
      await Promise.all(chunk.map(async (segment) => {
        const cacheKey = segmentToCacheKey.get(segment.id)
        let openAiImageUrl
        
        console.log(`[Cache Miss] Generating new GPT Image 2 frame for segment ${segment.id}...`)
        try {
          console.log(`[OpenAI] Attempting GPT Image 2 generation with key starting with: ${process.env.OPENAI_API_KEY?.substring(0, 7)}...`);
          const response = await openai.images.generate({
            model: 'gpt-image-2',
            prompt: segment.visualPrompt ? segment.visualPrompt.substring(0, 4000) : "Cinematic scene",
            size: '1792x1024',
            n: 1,
          })
          if (response.data?.[0]?.b64_json) {
            openAiImageUrl = 'data:image/png;base64,' + response.data[0].b64_json;
          } else {
            openAiImageUrl = response.data?.[0]?.url || response.data?.[0]?.image_url || response.data?.[0]?.asset_url || response.data?.[0]?.link;
            if (!openAiImageUrl && typeof response.data?.[0] === 'string') openAiImageUrl = response.data[0];
          }
          if (!openAiImageUrl) throw new Error(`Missing image URL in OpenAI response: ${JSON.stringify(response.data)}`);
        } catch (openaiError) {
          // Fallback to GPT Image 1 Mini on any failure
          console.warn(`[Fallback] GPT Image 2 failed (${openaiError.message}). Falling back to GPT Image 1 Mini for segment ${segment.id}.`)
          
          let safePrompt = segment.visualPrompt ? segment.visualPrompt.substring(0, 1000) : "Cinematic scene";
          if (openaiError.message.toLowerCase().includes('safety') || openaiError.message.toLowerCase().includes('rejected')) {
              console.warn(`[Safety Filter] Triggered! Replacing prompt with safe override.`);
              safePrompt = "A beautiful, peaceful, abstract cinematic visualization of music and glowing light, safe for all audiences, vibrant colors";
          }

          try {
            const fallbackResponse = await openai.images.generate({
              model: 'gpt-image-1-mini',
              prompt: safePrompt,
              size: '1536x1024',
              n: 1,
            })
            if (fallbackResponse.data?.[0]?.b64_json) {
              openAiImageUrl = 'data:image/png;base64,' + fallbackResponse.data[0].b64_json;
            } else {
              openAiImageUrl = fallbackResponse.data?.[0]?.url || fallbackResponse.data?.[0]?.image_url || fallbackResponse.data?.[0]?.asset_url || fallbackResponse.data?.[0]?.link;
              if (!openAiImageUrl && typeof fallbackResponse.data?.[0] === 'string') openAiImageUrl = fallbackResponse.data[0];
            }
            if (!openAiImageUrl) throw new Error(`Missing image URL in OpenAI fallback response: ${JSON.stringify(fallbackResponse.data)}`);
          } catch (ultimateError) {
            console.warn(`[Ultimate Fallback] OpenAI generation failed completely (${ultimateError.message}). Using placeholder image to prevent FFmpeg crash.`)
            openAiImageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1024&h=1024&fit=crop'
          }
        }

        let finalImageUrl
        // 4. Cloudinary Handoff
        if (openAiImageUrl && openAiImageUrl.startsWith('data:image/')) {
          const uploadResult = await new Promise((resolve, reject) => {
             cloudinary.uploader.upload(openAiImageUrl, {
               folder: 'shades-of-sg/frames',
               resource_type: 'image'
             }, (error, result) => {
               if (error) reject(new Error(`Cloudinary Data URI Upload Error: ${error.message}`));
               else resolve(result);
             });
          });
          finalImageUrl = uploadResult.secure_url;
        } else {
          finalImageUrl = await aiStorageService.uploadImageFromUrl(openAiImageUrl)
        }

        imagePromptCache.set(cacheKey, finalImageUrl)
      }))
    }

    // 5. Database Saving
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
