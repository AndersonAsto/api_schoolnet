const express = require('express');
const router = express.Router();
const generalAvarageController = require('../controllers/generalAverage.controller');

router.post('/generalAvarage/calculate', generalAvarageController.calculateAnnualAverage);
router.get('/generalAvarage/byStudentYearAndSchedule', generalAvarageController.getGeneralAvarageByFilters);

module.exports = router;
