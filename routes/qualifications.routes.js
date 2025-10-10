const express = require('express');
const router = express.Router();
const qualificationsController = require('../controllers/qualifications.controller');

router.post('/qualifications/bulkCreate', qualificationsController.createBulk);
router.get('/qualifications/list', qualificationsController.getQualifications);
router.put('/qualifications/bulkUpdate', qualificationsController.bulkUpdateQualifications);
router.get('/qualifications/byScheduleAndDay', qualificationsController.getByScheduleAndDay);
router.get('/qualifications/byStudent/:studentId/schedule/:scheduleId', qualificationsController.getByStudentAndSchedule);

module.exports = router;
