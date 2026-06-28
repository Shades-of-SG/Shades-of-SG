const express = require('express')
const router = express.Router()
const generationController = require('../controllers/generationController')

// Placeholder Authentication Middleware (To be replaced when auth is fully integrated)
const requireAuth = (req, res, next) => {
  // req.user = { id: 'temp-admin-id' };
  next()
}

// Route: POST /api/generation/:id/generate
router.post('/:id/generate', requireAuth, generationController.startGeneration)

module.exports = router
