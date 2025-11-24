const express = require('express');
const router = express.Router();
const qualificationsController = require('../controllers/qualifications.controller');

router.post('/qualifications/bulkCreate', qualificationsController.bulkCreateQualifications);
router.get('/qualifications/list', qualificationsController.getQualifications);
router.put('/qualifications/bulkUpdate', qualificationsController.bulkUpdateQualifications);
router.get('/qualifications/byScheduleAndDay', qualificationsController.getQualificationsByScheduleAndDay);
router.get('/qualifications/byStudent/:studentId/schedule/:scheduleId', qualificationsController.getQualificationsByScheduleAndStudent);
router.get('/qualifications/by-group/:teacherGroupId/student/:studentId', qualificationsController.getQualificationsByGroupAndStudent);

module.exports = router;
