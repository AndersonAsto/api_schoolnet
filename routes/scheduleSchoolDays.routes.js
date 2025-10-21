const express = require('express');
const router = express.Router();
const sSDController = require('../controllers/scheduleSchoolDays.controller');

router.post('/scheduleSDs/create', sSDController.generateScheduleDays);
router.get('/scheduleSDs/list', sSDController.getScheduleDays);
router.post('/scheduleSDs/create-by-techer', sSDController.generateTeacherScheduleDays);
router.get('/scheduleSDs/by-schedule/:scheduleId', sSDController.getDaysBySchedule);

module.exports = router;