const { GenerationJob } = require('../models')
const aiScenePlanner = require('../services/aiScenePlanner')

/**
 * POST /api/generation/:id/generate
 * Initiates the AI scene generation pipeline asynchronously.
 */
const startGeneration = async (req, res, next) => {
  try {
    const songId = req.params.id

    // 1. Prevent duplicate generation jobs
    const existingJob = await GenerationJob.findOne({
      where: {
        songId: songId,
        status: 'IN_PROGRESS',
      },
    })

    if (existingJob) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'A generation job is already in progress for this song.',
      })
    }

    // 2. Create a new pending job record
    const newJob = await GenerationJob.create({
      songId: songId,
      status: 'IN_PROGRESS',
    })

    // 3. Fire-and-Forget Background Process
    // We do NOT await this. We let it run in the background.
    aiScenePlanner
      .generateScenePlan(songId)
      .then(async () => {
        await newJob.update({ status: 'COMPLETED' })
        // Note: When Phase 3 is ready, we will trigger the DALL-E generation here instead of marking COMPLETED
      })
      .catch(async (error) => {
        console.error(`[Job ${newJob.id}] Generation Failed:`, error)
        await newJob.update({
          status: 'FAILED',
          errorMessage: error.message || 'An unknown error occurred during scene generation.',
        })
      })

    // 4. Instantly acknowledge the request
    return res.status(202).json({
      message: 'Scene generation job accepted and started in the background.',
      jobId: newJob.id,
      songId: songId,
    })
  } catch (error) {
    // Only catch synchronous setup errors here (e.g., DB connection failing on job creation)
    next(error)
  }
}

module.exports = {
  startGeneration,
}
