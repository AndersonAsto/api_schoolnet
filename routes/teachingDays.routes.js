const express = require('express');
const router = express.Router();
const schoolDaysController = require('../controllers/teachingDays.controller');

router.get('/schoolDays/list', schoolDaysController.getSchoolDays);
router.post('/schoolDays/bulkCreate', schoolDaysController.bulkCreateSchoolDays);
router.get('/schoolDays/byYear/:yearId', schoolDaysController.getSchoolDaysByYear);

module.exports = router;