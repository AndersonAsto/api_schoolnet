const express = require('express');
const router = express.Router();
const generalAvarageController = require('../controllers/overallCourseAverage.controller');

router.post('/generalAvarage/calculate', generalAvarageController.calculateAnnualAverage);
router.get('/generalAvarage/by-filters', generalAvarageController.getGeneralAvarageByFilters);
router.get('/generalAvarage/by-SYA', generalAvarageController.getGeneralAvarageBySYA);
router.get('/generalAvarage/by-assignment', generalAvarageController.getGeneralAvarageByAssignment);

module.exports = router;
