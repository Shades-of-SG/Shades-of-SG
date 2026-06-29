const express = require('express')
const router = express.Router()
const { getAllJobs, getGenerationStatus } = require('../controllers/generationController')

// Placeholder for future JWT authentication middleware
const requireAuth = (req, res, next) => next()

// Routes for generation jobs dashboard and polling
router.get('/', requireAuth, getAllJobs)
router.get('/:id/status', requireAuth, getGenerationStatus)

module.exports = router
