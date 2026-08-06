const express = require('express');
const instrumentController = require('../controllers/instrumentController');

const router = express.Router();

router.get('/lab-samples', instrumentController.getLabSamples);

module.exports = router;
