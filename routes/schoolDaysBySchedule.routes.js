const express = require('express');
const router = express.Router();
const sSDController = require('../controllers/schoolDaysBySchedule.controller');

router.post('/scheduleSDs/create', sSDController.bulkCreateSchoolDaysByYearAndSchedule);
router.get('/scheduleSDs/list', sSDController.getSchoolDaysBySchedule);
router.post('/scheduleSDs/create-by-techer', sSDController.bulkCreateSchoolDaysByYearAndTeacher);
router.get('/scheduleSDs/by-schedule/:scheduleId', sSDController.getDaysBySchedule);

module.exports = router;