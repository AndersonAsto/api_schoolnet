const express = require('express');
const router = express.Router();
const reportControllers = require('../controllers/reports.controller');

router.get('/reports/student/:studentEnrollmentId/year/:yearId', reportControllers.generateReportByYearAndStudent);

module.exports = router;
