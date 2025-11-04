const express = require('express');
const router = express.Router();
const assistancesController = require('../controllers/assistances.controller');

router.post('/assistances/bulkCreate', assistancesController.createBulk);
router.get('/assistances/list', assistancesController.getAssistances);
router.put("/assistances/bulkUpdate", assistancesController.bulkUpdateAssistances);
router.get('/assistances/byScheduleAndDay', assistancesController.getByScheduleAndDay);
router.get('/assistances/byStudent/:studentId/schedule/:scheduleId', assistancesController.getByStudentAndSchedule);
router.get('/assistances/by-group/:teacherGroupId/student/:studentId', assistancesController.getAssistancesByGroupAndStudent);

module.exports = router;
