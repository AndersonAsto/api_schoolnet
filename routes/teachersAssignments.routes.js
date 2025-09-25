const express = require('express');
const router = express.Router();
const teachersAssignmentsController = require('../controllers/teachersAssignments.controller');

router.post('/teachersAssignments/create', teachersAssignmentsController.createTeacherAssignament);
router.get('/teachersAssignments/list', teachersAssignmentsController.getTeacherAssignaments);

module.exports = router;