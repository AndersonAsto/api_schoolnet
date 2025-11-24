const express = require('express');
const router = express.Router();
const annualAverageController = require('../controllers/annualAverage.controller');

router.post("/annualaverage/calculate", annualAverageController.calculateAnnualAverage);
router.get('/annualAverage/by-year-&-tutor/:yearId/:tutorId', annualAverageController.getAnnualAverageByYearAndTutor);
router.get('/annualAverage/by-year-&-student/:yearId/:studentId', annualAverageController.getAnnualAverageByYearAndStudent);
router.post('/annualAverage/by-year-and-students', annualAverageController.getAnnualAverageByYearAndStudents);

module.exports = router;