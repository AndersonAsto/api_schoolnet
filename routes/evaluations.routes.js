const express = require('express');
const router = express.Router();
const examsController = require('../controllers/evaluations.controller');

router.get('/exams/list', examsController.getEvaluations);
router.get('/exams/student/:studentId', examsController.getEvaluationsByStudent);
router.get('/exams/student/:studentId/group/:assigmentId', examsController.getEvaluationsByGroupAndStudent);
router.get('/exams/block/:teachingBlockId/group/:assigmentId', examsController.getEvaluationsByBlockAndGroup);
router.post('/exams/create', examsController.createEvaluation);
router.delete('/exams/delete/:id', examsController.deleteEvaluation);
router.put('/exams/update/:id', examsController.updateEvaluation);

module.exports = router;