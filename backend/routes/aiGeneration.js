const express = require('express')
const router = express.Router()
const {
  getAllJobs,
  getGenerationStatus,
  startGeneration,
  deleteJob,
  exportVideo,
  regenerateFrame
} = require('../controllers/generationController')
const { requireCreator } = require('../middleware/auth')

// Routes for generation jobs dashboard and polling
router.get('/', requireCreator, getAllJobs)
router.get('/:id/status', requireCreator, getGenerationStatus)
router.delete('/:id', requireCreator, deleteJob)

router.post('/start', requireCreator, startGeneration)

// Export Final Video
router.post('/:jobId/export', requireCreator, exportVideo)

// Regenerate single frame
router.post('/frame/:frameId/regenerate', requireCreator, regenerateFrame)

module.exports = router
