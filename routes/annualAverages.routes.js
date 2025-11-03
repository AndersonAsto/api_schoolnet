const express = require('express');
const router = express.Router();
const annualAverageController = require('../controllers/annualAverage.controller');

router.post("/annualaverage/calculate", annualAverageController.calculateAndSaveAnnualAverage);

module.exports = router;