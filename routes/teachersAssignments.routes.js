const express = require('express');
const router = express.Router();
const teachersAssignmentsController = require('../controllers/teachersAssignments.controller');

router.post('/teachersAssignments/create', teachersAssignmentsController.createTeacherAssignament);
router.get('/teachersAssignments/list', teachersAssignmentsController.getTeacherAssignaments);
router.delete('/teachersAssignments/delete/:id', teachersAssignmentsController.deleteTeacherById);

module.exports = router;