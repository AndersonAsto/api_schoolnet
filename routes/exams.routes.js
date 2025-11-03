const express = require('express');
const router = express.Router();
const examsController = require('../controllers/exams.controller');

router.get('/exams/list', examsController.getAllExams);
router.get('/exams/student/:studentId', examsController.getExamsByStudentId);
router.get('/exams/student/:studentId/group/:assigmentId', examsController.getExamsByStudentAndGroup);
router.post('/exams/create', examsController.createExam);

module.exports = router;