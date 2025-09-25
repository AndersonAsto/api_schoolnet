const express = require('express');
const router = express.Router();
const gradesController = require('../controllers/grades.controller');

router.post('/grades/create', gradesController.createGrade);
router.get('/grades/list', gradesController.getGrades);
router.put('/grades/update/:id', gradesController.updateGrade);
router.delete('/grades/delete/:id', gradesController.deleteGradeById);

module.exports = router;