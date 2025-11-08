const express = require('express');
const router = express.Router();
const studentEnrollmentsController = require('../controllers/studentsEnrollments.controller');

router.post('/studentEnrollments/create', studentEnrollmentsController.createStudentEnrollment);
router.get('/studentEnrollments/list', studentEnrollmentsController.getStudentEnrollments);
router.get("/studentEnrollments/bySchedule/:scheduleId", studentEnrollmentsController.getStudentsBySchedule);
router.get("/studentEnrollments/by-group/:asigmentId", studentEnrollmentsController.getStudentsByGroup);
router.delete('/studentEnrollments/delete/:id', studentEnrollmentsController.deleteStudentById);
router.put('/studentEnrollments/update/:id', studentEnrollmentsController.updatedStudent);

module.exports = router;