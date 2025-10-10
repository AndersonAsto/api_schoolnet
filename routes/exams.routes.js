const express = require('express');
const router = express.Router();
const examsController = require('../controllers/exams.controller');

router.get('/exams/list', examsController.getAllExams);
router.get('/exams/student/:studentId', examsController.getExamsByStudentId);
router.post('/exams/create', examsController.createExam);

module.exports = router;