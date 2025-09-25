const express = require('express');
const router = express.Router();
const schedulesController = require('../controllers/schedules.controller');

router.post('/schedules/create', schedulesController.createSchedule);
router.get('/schedules/list', schedulesController.getSchedules);

module.exports = router;