const fs = require('fs').promises
const path = require('path')
const { GenerationJob, Song, SceneSegment, GeneratedFrame } = require('../models')
const { generateScenePlan } = require('../services/aiScenePlanner')
const { generateFrames } = require('../services/frameGenerator')
const { assembleVideo } = require('../services/videoAssembler')

const completeGeneration = async (jobId) => {
  const job = await GenerationJob.findByPk(jobId)
  if (!job) throw new Error(`Job ${jobId} not found in database.`)
  const song = await Song.findByPk(job.songId)
  if (!song) throw new Error(`Song ${job.songId} not found in database.`)
  if (job.status !== 'PROCESSING' || song.status !== 'GENERATING') {
    throw new Error('Generation was stopped because the creator selected a finished uploaded video.')
  }
  if (!song.videoUrl) throw new Error('Generation cannot complete without a video URL.')
  await job.update({ status: 'COMPLETED', errorMessage: null, completedAt: new Date() })
  await song.update({ status: 'READY' })
  return { job, song }
}

const assertGenerationIsActive = async (jobId) => {
  const job = await GenerationJob.findByPk(jobId)
  const song = job ? await Song.findByPk(job.songId) : null
  if (!job || !song || job.status !== 'PROCESSING' || song.status !== 'GENERATING') {
    throw new Error('Generation was stopped because the creator selected a finished uploaded video.')
  }
}

const failGeneration = async (jobId, error) => {
  const job = await GenerationJob.findByPk(jobId)
  if (!job) return null
  await job.update({ status: 'FAILED', errorMessage: error?.message || String(error || 'Generation failed.') })
  const song = await Song.findByPk(job.songId)
  if (song?.status === 'GENERATING') await song.update({ status: song.videoUrl ? 'READY' : 'DRAFT' })
  return { job, song }
}

const usePlaceholderVideo = async (songId) => {
  const placeholderVideoUrl = process.env.PLACEHOLDER_VIDEO_URL?.trim()
  if (!placeholderVideoUrl) return false
  const song = await Song.findByPk(songId)
  if (!song) throw new Error(`Song ${songId} not found in database.`)
  await song.update({ videoUrl: placeholderVideoUrl, videoPublicId: null })
  return true
}

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

    const song = await Song.findOne({ where: { id: songId, creatorId: req.authUserRecord.id } })
    if (!song) {
      const error = new Error('Song not found.')
      error.statusCode = 404
      throw error
    }

    if (!['DRAFT', 'READY'].includes(song.status)) {
      const error = new Error('Only DRAFT or READY songs can start generation.')
      error.statusCode = 409
      throw error
    }

    const missing = []
    if (!song.audioUrl) missing.push('audioUrl')
    if (!song.rawLyrics?.trim()) missing.push('rawLyrics')
    if (missing.length) {
      const error = new Error(`Song is missing generation requirements: ${missing.join(', ')}.`)
      error.statusCode = 400
      throw error
    }

    const activeJob = await GenerationJob.findOne({
      where: { songId, status: ['QUEUED', 'PROCESSING'] },
    })
    if (activeJob) {
      const error = new Error('This song already has an active generation job.')
      error.statusCode = 409
      throw error
    }

    // 1. Create the tracking ticket
    let job
    try {
      job = await GenerationJob.create({ songId, status: 'QUEUED' })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        error.statusCode = 409
        error.message = 'This song already has an active generation job.'
      }
      throw error
    }

    // 2. Fire the background worker WITHOUT awaiting it
    await song.update({ status: 'GENERATING' })
    if (process.env.NODE_ENV !== 'test') runGenerationPipeline(job.id).catch(console.error)

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
    // Route param is :id (see aiGeneration.js), not :jobId
    const { id } = req.params

    const job = await GenerationJob.findOne({
      where: { id },
      include: [
        {
          model: Song, 
          as: 'song', 
          where: { creatorId: req.authUserRecord.id },
          attributes: ['id', 'title', 'artist', 'audioUrl', 'videoUrl', 'videoPublicId', 'status'],
          include: [
            {
              model: SceneSegment,
              as: 'sceneSegments',
              order: [['startTime', 'ASC']],
              include: [
                {
                  model: GeneratedFrame,
                  as: 'generatedFrames'
                }
              ]
            }
          ]
        }
      ],
    })

    if (!job) {
      const error = new Error('Generation job not found.')
      error.statusCode = 404
      throw error
    }

    const data = job.get({ plain: true })
    const placeholderVideoUrl = process.env.PLACEHOLDER_VIDEO_URL?.trim()
    data.videoIsTemporary = Boolean(placeholderVideoUrl && data.song?.videoUrl === placeholderVideoUrl)
    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}

const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await GenerationJob.findAll({
      include: [{ model: Song, as: 'song', attributes: ['id', 'title', 'artist', 'status', 'videoUrl'], where: { creatorId: req.authUserRecord.id } }],
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

    await job.update({ status: 'PROCESSING', startedAt: new Date(), errorMessage: null })
    console.log(`[Phase 2] Generating Scene Plan...`)
    await generateScenePlan(jobId, job.songId)
    await assertGenerationIsActive(jobId)

    console.log(`[Phase 3] Generating Image Frames...`)
    await generateFrames(jobId, job.songId)
    await assertGenerationIsActive(jobId)

    const placeholderApplied = await usePlaceholderVideo(job.songId)
    if (placeholderApplied) {
      console.warn(`[Temporary Video] Job ${jobId} is using configured PLACEHOLDER_VIDEO_URL.`)
    } else {
      console.log(`[Phase 4] Assembling Video with FFmpeg...`)
      await assembleVideo(jobId, job.songId)
    }
    await assertGenerationIsActive(jobId)

    // Update DB on Success
    await completeGeneration(job.id)

    // Run Cleanup on successful completion
    await cleanupJobFiles(jobId)
    console.log(`[Background Worker] Pipeline COMPLETED successfully for Job ID: ${jobId}`)
  } catch (error) {
    console.error(`[Generation Pipeline Error] Job ${jobId}:`, error)

    // ERROR BOUNDARY
    try {
      if (jobId) {
        await failGeneration(jobId, error)
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
  runGenerationPipeline,
  completeGeneration,
  failGeneration,
  usePlaceholderVideo,
}
