const express = require('express')
const router = express.Router()
const {
  getAllJobs,
  getGenerationStatus,
  startGeneration,
} = require('../controllers/generationController')
const { requireCreator } = require('../middleware/auth')

// Routes for generation jobs dashboard and polling
router.get('/', requireCreator, getAllJobs)
router.get('/:id/status', requireCreator, getGenerationStatus)

// POST /start - Triggers the asynchronous generation pipeline (No auth yet for testing)
router.post('/start', requireCreator, startGeneration)

module.exports = router
