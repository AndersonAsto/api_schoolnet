const express = require('express');
const router = express.Router();
const holidaysController = require('../controllers/holidays.controller');

router.post('/holidays/create', holidaysController.createHoliday);
router.get('/holidays/list', holidaysController.getHolidays);
router.get('/holidays/byYear/:yearId', holidaysController.getHolidaysByYear);
router.delete('/holydays/delete/:id', holidaysController.deleteHoliday);
router.put('/holydays/update/:id', holidaysController.updateHoliday);
module.exports = router;