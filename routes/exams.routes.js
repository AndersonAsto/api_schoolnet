const express = require('express');
const router = express.Router();
const examsController = require('../controllers/exams.controller');

router.get('/exams/list', examsController.getAllExams);
router.get('/exams/student/:studentId', examsController.getExamsByStudentId);
router.get('/exams/student/:studentId/group/:assigmentId', examsController.getExamsByStudentAndGroup);
router.get('/exams/block/:teachingBlockId/group/:assigmentId', examsController.getExamsByBlockAndGroup);
router.post('/exams/create', examsController.createExam);
router.delete('/exams/delete/:id', examsController.deleteExamsById);

module.exports = router;