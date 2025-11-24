const express = require('express');
const router = express.Router();
const teachersAssignmentsController = require('../controllers/teacherAssignments.controller');

router.post('/teachersAssignments/create', teachersAssignmentsController.createTeacherAssignment);
router.get('/teachersAssignments/list', teachersAssignmentsController.getTeacherAssignments);
router.delete('/teachersAssignments/delete/:id', teachersAssignmentsController.deleteTeacherAssignment);
router.put('/teachersAssignments/update/:id', teachersAssignmentsController.updateTeacherAssignment);

module.exports = router;