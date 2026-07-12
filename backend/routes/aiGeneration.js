const express = require('express')
const router = express.Router()
const {
  getAllJobs,
  getGenerationStatus,
  startGeneration,
  exportVideo,
  regenerateFrame
} = require('../controllers/generationController')
const { requireCreator, requireAuth } = require('../middleware/auth')

// Routes for generation jobs dashboard and polling
router.get('/', requireCreator, getAllJobs)
router.get('/:id/status', requireCreator, getGenerationStatus)

// Starts generation for an existing creator-owned Song.
router.post('/start', requireCreator, startGeneration)

// Export Final Video
router.post('/:jobId/export', requireAuth, exportVideo)

// Regenerate single frame
router.post('/frame/:frameId/regenerate', requireAuth, regenerateFrame)

module.exports = router
