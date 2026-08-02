const express = require('express')
const router = express.Router()
const {
  getAllJobs,
  getGenerationStatus,
  startGeneration,
  deleteJob,
  exportVideo,
  regenerateFrame,
  retryGeneration,
  confirmScenes,
  regenerateSingleScenePrompt
} = require('../controllers/generationController')
const { requireCreator } = require('../middleware/auth')

// Routes for generation jobs dashboard and polling
router.get('/', requireCreator, getAllJobs)
router.get('/:id/status', requireCreator, getGenerationStatus)
router.delete('/:id', requireCreator, deleteJob)

router.post('/start', requireCreator, startGeneration)

// Retry / Resume a FAILED job
router.post('/retry/:jobId', requireCreator, retryGeneration)

// Export Final Video
router.post('/:jobId/export', requireCreator, exportVideo)

// Regenerate single frame
router.post('/frame/:frameId/regenerate', requireCreator, regenerateFrame)

// Scene Approval: Regenerate a single scene's visual prompt (must be BEFORE /:id param routes)
router.post('/scene/regenerate-prompt', requireCreator, regenerateSingleScenePrompt)

// Scene Approval: Confirm edited scenes and resume pipeline
router.post('/:id/confirm-scenes', requireCreator, confirmScenes)

module.exports = router
