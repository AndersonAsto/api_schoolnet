const express = require('express');
const router = express.Router();
const generalAvarageController = require('../controllers/overallCourseAverage.controller');

router.post('/generalAvarage/calculate', generalAvarageController.calculateOverallCourseAverage);
router.get('/generalAvarage/by-filters', generalAvarageController.getOverallCourseAverageByYearAndStudent);
router.get('/generalAvarage/by-SYA', generalAvarageController.getOverallCourseAverageByYearGroupAndStudent);
router.get('/generalAvarage/by-assignment', generalAvarageController.getOverallCourseAverageByYearAndGroup);

module.exports = router;
