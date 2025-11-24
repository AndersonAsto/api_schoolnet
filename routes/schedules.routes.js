const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedules.controller');

router.post('/schedules/create', schedulesController.createSchedule);
router.get('/schedules/list', schedulesController.getSchedules);
router.get("/schedules/by-user/:userId", schedulesController.getSchedulesByUser);
router.get('/schedules/by-user/:userId/year/:yearId', schedulesController.getSchedulesByYearAndUser);
router.get('/schedules/by-teacher/:teacherId', schedulesController.getSchedulesByTeacher);
router.delete('/schedules/delete/:id', schedulesController.deleteSchedule);
router.put('/schedules/update/:id', schedulesController.updateSchedule);
router.get('/schedules/by-year/:yearId', schedulesController.getSchedulesByYear);

module.exports = router;