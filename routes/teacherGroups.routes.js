const express = require('express');
const router = express.Router();
const teacherGroupController = require('../controllers/teacherGroups.controller');

router.post('/teacherGroups/create', teacherGroupController.createTeacherGroup);
router.get('/teacherGroups/list', teacherGroupController.getTeacherGroups);
router.put('/teacherGroups/update/:id', teacherGroupController.updateTeacherGroup);
router.delete('/teacherGroups/delete/:id', teacherGroupController.deleteTeacherGroup);
router.get('/teacherGroups/by-user/:userId/by-year/:yearId', teacherGroupController.getGroupsByUserYear);

module.exports = router;