const express = require('express')
const router = express.Router()
const {
  getAllJobs,
  getGenerationStatus,
  startGeneration,
  exportVideo,
  regenerateFrame
} = require('../controllers/generationController')

// Placeholder for future JWT authentication middleware
const requireAuth = (req, res, next) => next()

// Routes for generation jobs dashboard and polling
router.get('/', requireAuth, getAllJobs)
router.get('/:id/status', requireAuth, getGenerationStatus)

// POST /start - Triggers the asynchronous generation pipeline (No auth yet for testing)
router.post('/start', startGeneration)

// Export Final Video
router.post('/:jobId/export', requireAuth, exportVideo)

// Regenerate single frame
router.post('/frame/:frameId/regenerate', requireAuth, regenerateFrame)

module.exports = router
