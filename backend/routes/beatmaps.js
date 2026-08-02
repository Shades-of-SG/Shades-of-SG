const express = require('express')
const { deleteDraftBeatmap, generateAllBeatmaps, generateStoredBeatmap, getBeatmap, listBeatmaps, previewBeatmap, publishBeatmap, unpublishBeatmap, updateDraftSettings } = require('../controllers/beatmapController')
const { optionalAuth, requireCreator } = require('../middleware/auth')

const router = express.Router({ mergeParams: true })
router.get('/', optionalAuth, listBeatmaps)
router.get('/:difficulty/preview', requireCreator, previewBeatmap)
router.get('/:difficulty', optionalAuth, getBeatmap)
router.post('/generate', requireCreator, generateStoredBeatmap)
router.post('/generate-all', requireCreator, generateAllBeatmaps)
router.put('/:difficulty/settings', requireCreator, updateDraftSettings)
router.put('/:difficulty/publish', requireCreator, publishBeatmap)
router.put('/:difficulty/unpublish', requireCreator, unpublishBeatmap)
router.delete('/:difficulty/draft', requireCreator, deleteDraftBeatmap)

module.exports = router
