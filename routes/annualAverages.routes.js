const express = require('express');
const router = express.Router();
const annualAverageController = require('../controllers/annualAverage.controller');

router.post("/annualaverage/calculate", annualAverageController.calculateAndSaveAnnualAverage);
router.get('/annualAverage/by-year-&-tutor/:yearId/:tutorId', annualAverageController.getAnnualAverageByYearAndGroup);
router.get('/annualAverage/by-year-&-student/:yearId/:studentId', annualAverageController.getAnnualAverageByYearAndStudent);

module.exports = router;