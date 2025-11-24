const express = require('express');
const router = express.Router();
const attendancesControllers = require('../controllers/attendances.controller');

router.post('/assistances/bulkCreate', attendancesControllers.bulkCreateAttendances);
router.get('/assistances/list', attendancesControllers.getAttendances);
router.put("/assistances/bulkUpdate", attendancesControllers.bulkUpdateAttendances);

router.get('/assistances/byScheduleAndDay', attendancesControllers.getAttendancesByScheduleAndDay);
router.get('/assistances/byStudent/:studentId/schedule/:scheduleId', attendancesControllers.getAttendancesByScheduleAndStudent);
router.get('/assistances/by-group/:teacherGroupId/student/:studentId', attendancesControllers.getAttendancesByGroupAndStudent);

module.exports = router;
