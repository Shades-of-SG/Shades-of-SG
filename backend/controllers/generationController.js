const { GenerationJob, Song } = require('../models')

/**
 * Retrieves all generation jobs, including their associated song titles.
 */
const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await GenerationJob.findAll({
      include: [
        {
          model: Song,
          as: 'song',
          attributes: ['title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    const formattedJobs = jobs.map((job) => {
      const plainJob = job.get({ plain: true })
      return {
        ...plainJob,
        Song: plainJob.song,
      }
    })

    return res.status(200).json({
      success: true,
      data: formattedJobs,
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Retrieves the live status of a specific generation job.
 */
const getGenerationStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    const job = await GenerationJob.findByPk(id, {
      include: [
        {
          model: Song,
          as: 'song',
          attributes: ['title'],
        },
      ],
    })

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      })
    }

    const plainJob = job.get({ plain: true })

    return res.status(200).json({
      success: true,
      data: {
        status: plainJob.status,
        errorMessage: plainJob.errorMessage,
        Song: plainJob.song,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * Placeholder for the background video generation pipeline.
 */
const runGenerationPipeline = async (jobId) => {
  console.log(`[Background Worker] Starting generation pipeline for Job ID: ${jobId}...`)
  // Future logic goes here...
}

/**
 * Initiates the AI generation process.
 * Responds immediately to the client while the heavy lifting runs in the background.
 */
const startGeneration = async (req, res, next) => {
  try {
    const { songId } = req.body

    if (!songId) {
      return res.status(400).json({
        success: false,
        message: 'songId is required to start the generation process.',
      })
    }

    const newJob = await GenerationJob.create({
      songId: songId,
      status: 'PROCESSING',
      progress: 10,
    })

    // The Background Trigger (No await)
    runGenerationPipeline(newJob.id).catch((err) => {
      console.error(`[Background Worker Error] Job ID ${newJob.id}:`, err)
    })

    return res.status(202).json({
      success: true,
      jobId: newJob.id,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllJobs,
  getGenerationStatus,
  startGeneration,
  runGenerationPipeline,
}
