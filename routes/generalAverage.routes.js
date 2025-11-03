const express = require('express');
const router = express.Router();
const generalAvarageController = require('../controllers/generalAverage.controller');

router.post('/generalAvarage/calculate', generalAvarageController.calculateAnnualAverage);
router.get('/generalAvarage/by-filters', generalAvarageController.getGeneralAvarageByFilters);

module.exports = router;
