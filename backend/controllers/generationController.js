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
          attributes: ['title'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    return res.status(200).json({
      success: true,
      data: jobs,
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

    return res.status(200).json({
      success: true,
      data: {
        status: job.status,
        errorMessage: job.errorMessage,
        Song: job.Song,
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
