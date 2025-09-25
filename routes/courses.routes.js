const express = require('express');
const router = express.Router();
const coursesController = require('../controllers/courses.controller');

router.post('/courses/create', coursesController.createCourse);
router.get('/courses/list', coursesController.getCourses);
router.put('/courses/update/:id', coursesController.updateCourse);
router.delete('/courses/delete/:id', coursesController.deleteCourseById);

module.exports = router;