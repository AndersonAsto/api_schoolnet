const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedules.controller');

router.post('/schedules/create', schedulesController.createSchedule);
router.get('/schedules/list', schedulesController.getSchedules);
router.get("/schedules/by-user/:userId", schedulesController.getSchedulesByUser);
router.get('/schedules/by-user/:userId/year/:yearId', schedulesController.getSchedulesByUserAndYear);
router.get('/schedules/by-teacher/:teacherId', schedulesController.getSchedulesByTeacher);
router.delete('/schedules/delete/:id', schedulesController.deleteScheduleById);

module.exports = router;