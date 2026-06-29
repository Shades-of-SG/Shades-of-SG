const { GenerationJob, Song } = require('../models')

/**
 * Retrieves all generation jobs, including their associated song titles.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await GenerationJob.findAll({
      include: [
        {
          model: Song,
          as: 'song', // STRICT MATCH: Must match the alias defined in models/index.js
          attributes: ['title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    // Map the database's lower-case 'song' alias to the upper-case 'Song'
    // expected by the React frontend's data contract.
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getGenerationStatus = async (req, res, next) => {
  try {
    const { id } = req.params

    const job = await GenerationJob.findByPk(id, {
      include: [
        {
          model: Song,
          as: 'song', // STRICT MATCH: Must match the alias defined in models/index.js
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
        Song: plainJob.song, // Map alias to expected frontend contract
      },
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getAllJobs,
  getGenerationStatus,
}
