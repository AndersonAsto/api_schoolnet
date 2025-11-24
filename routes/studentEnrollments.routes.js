const express = require('express');
const router = express.Router();
const studentEnrollmentsController = require('../controllers/studentEnrollments.controller');

router.post('/studentEnrollments/create', studentEnrollmentsController.createStudentEnrollment);
router.get('/studentEnrollments/list', studentEnrollmentsController.getStudentEnrollments);
router.put('/studentEnrollments/update/:id', studentEnrollmentsController.updateStudentEnrollment);
router.delete('/studentEnrollments/delete/:id', studentEnrollmentsController.deleteStudentEnrollment);

router.get("/studentEnrollments/bySchedule/:scheduleId", studentEnrollmentsController.getStudentsBySchedule);
router.get("/studentEnrollments/by-group/:asigmentId", studentEnrollmentsController.getStudentsByGroup);
router.get('/studentEnrollments/by-tutor/:tutorId/by-year/:yearId', studentEnrollmentsController.getStudentsByTutorGroup);

module.exports = router;