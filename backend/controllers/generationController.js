// backend/controllers/generationController.js
const { GenerationJob } = require('../models')
const aiScenePlanner = require('../services/aiScenePlanner')
const frameGenerator = require('../services/frameGenerator')

/**
 * Controller to handle the kickoff of the AI Video Generation Pipeline.
 * Responds to the client immediately and delegates generation to a detached background process.
 */
const startGeneration = async (req, res, next) => {
  try {
    const { songId } = req.body

    if (!songId) {
      return res.status(400).json({ error: 'songId is required' })
    }

    // Upsert a GenerationJob to track the state
    const [job, created] = await GenerationJob.findOrCreate({
      where: { songId },
      defaults: { status: 'IN_PROGRESS', errorMessage: null },
    })

    if (!created && job.status === 'IN_PROGRESS') {
      return res
        .status(409)
        .json({ error: 'A generation job is already in progress for this song' })
    }

    // If the job was previously FAILED or COMPLETED, overwrite it to restart the process
    await job.update({ status: 'IN_PROGRESS', errorMessage: null })

    // Return a 202 Accepted response immediately so the frontend can start its polling loop
    res.status(202).json({
      message: 'AI Generation Pipeline started successfully',
      jobId: job.id,
    })

    // --- Detached Promise Chain (Background Process) ---
    // We intentionally DO NOT await this chain so the HTTP cycle can safely close.
    aiScenePlanner
      .generateScenePlan(songId)
      .then(() => {
        // Phase 3: The Image Loop & Chorus-Caching
        // Execute sequentially only AFTER the Scene Segment plans are safely written to DB
        return frameGenerator.generateFramesForSong(songId)
      })
      .then(() => {
        // Pipeline successfully reached the end!
        return job.update({ status: 'COMPLETED' })
      })
      .catch((error) => {
        // Centralized Pipeline Error Handling
        // Catches errors thrown by either the planner (Phase 2) or the image generator (Phase 3)
        console.error(`[Generation Pipeline Failed for Song ${songId}]:`, error)

        return job.update({
          status: 'FAILED',
          errorMessage: error.message || 'An unknown error occurred during generation',
        })
      })
  } catch (error) {
    // Passes immediate synchronous controller errors (e.g. database disconnects on findOrCreate)
    // down to the global Express error handler `next(error)`
    next(error)
  }
}

module.exports = {
  startGeneration,
}
