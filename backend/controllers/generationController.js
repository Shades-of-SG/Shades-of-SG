const fs = require('fs').promises
const path = require('path')
const { GenerationJob, Song } = require('../models')
const { generateScenePlan } = require('../services/aiScenePlanner')
const { generateFrames } = require('../services/frameGenerator')
const { assembleVideo } = require('../services/videoAssembler')

// ==========================================
// Phase 5: The Cleanup Utility
// ==========================================
const cleanupJobFiles = async (jobId) => {
  const tempDir = path.join(__dirname, '../storage/temp')
  const filesToDelete = [`${jobId}_audio.mp3`, `${jobId}_subs.srt`, `${jobId}_final.mp4`]

  console.log(`[Cleanup] Sweeping temp files for Job ${jobId}...`)

  // Try deleting the main files
  await Promise.allSettled(
    filesToDelete.map(async (fileName) => {
      try {
        await fs.unlink(path.join(tempDir, fileName))
        console.log(`[Cleanup] Deleted: ${fileName}`)
      } catch (err) {
        if (err.code !== 'ENOENT')
          console.error(`[Cleanup] Failed to delete ${fileName}:`, err.message)
      }
    })
  )

  // Wipe out any generated frame images (e.g., 123_frame_0.jpg)
  try {
    const allFiles = await fs.readdir(tempDir)
    const frameFiles = allFiles.filter(
      (file) => file.startsWith(`${jobId}_frame_`) && file.endsWith('.jpg')
    )

    await Promise.allSettled(frameFiles.map((file) => fs.unlink(path.join(tempDir, file))))
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[Cleanup] Could not read temp directory:', err)
  }
}

// ==========================================
// The Express Controllers
// ==========================================

const startGeneration = async (req, res, next) => {
  try {
    const { songId } = req.body

    if (!songId) {
      const error = new Error('Song ID is required.')
      error.statusCode = 400
      throw error
    }

    const song = await Song.findByPk(songId)
    if (!song) {
      const error = new Error('Song not found.')
      error.statusCode = 404
      throw error
    }

    // 1. Create the tracking ticket
    const job = await GenerationJob.create({
      songId,
      status: 'PROCESSING',
      progress: 10,
    })

    // 2. Fire the background worker WITHOUT awaiting it
    runGenerationPipeline(job.id).catch(console.error)

    // 3. Immediately return the ticket ID to the frontend
    return res.status(202).json({
      success: true,
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

const getGenerationStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params

    const job = await GenerationJob.findByPk(jobId, {
      include: [{ model: Song, attributes: ['title', 'artist'] }],
    })

    if (!job) {
      const error = new Error('Generation job not found.')
      error.statusCode = 404
      throw error
    }

    return res.json({
      success: true,
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await GenerationJob.findAll({
      include: [{ model: Song, attributes: ['title', 'artist'] }],
      order: [['createdAt', 'DESC']],
    })

    return res.json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    next(error)
  }
}

// ==========================================
// The Background Pipeline
// ==========================================

const runGenerationPipeline = async (jobId) => {
  console.log(`[Background Worker] Starting generation pipeline for Job ID: ${jobId}...`)

  try {
    const job = await GenerationJob.findByPk(jobId)
    if (!job) throw new Error(`Job ${jobId} not found in database.`)

    console.log(`[Phase 2] Generating Scene Plan...`)
    await generateScenePlan(jobId, job.songId)
    await job.update({ progress: 25 }) // Update progress bar

    console.log(`[Phase 3] Generating Image Frames...`)
    await generateFrames(jobId, job.songId)
    await job.update({ progress: 60 }) // Update progress bar

    console.log(`[Phase 4] Assembling Video with FFmpeg...`)
    await assembleVideo(jobId, job.songId)

    // Update DB on Success
    await job.update({
      status: 'COMPLETED',
      progress: 100,
      errorMessage: null,
    })

    // Run Cleanup on successful completion
    await cleanupJobFiles(jobId)
    console.log(`[Background Worker] Pipeline COMPLETED successfully for Job ID: ${jobId}`)
  } catch (error) {
    console.error(`[Generation Pipeline Error] Job ${jobId}:`, error)

    // ERROR BOUNDARY
    try {
      if (jobId) {
        await GenerationJob.update(
          {
            status: 'FAILED',
            errorMessage: error.message || 'An unknown error occurred during generation.',
          },
          { where: { id: jobId } }
        )
        await cleanupJobFiles(jobId) // Wipe broken files so they don't clog the server
      }
    } catch (fallbackError) {
      console.error(`[Fallback Failure] Job ${jobId}:`, fallbackError)
    }
  }
}

module.exports = {
  startGeneration,
  getGenerationStatus,
  getAllJobs,
}