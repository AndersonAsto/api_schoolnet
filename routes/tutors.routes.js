const express = require('express');
const router = express.Router();
const tutorsController = require('../controllers/tutors.controller');

router.post('/tutors/create', tutorsController.createTutor);
router.get('/tutors/list', tutorsController.getTutors);
router.put('/tutors/update/:id', tutorsController.updateTutor);
router.delete('/tutors/delete/:id', tutorsController.deleteTutor);

router.get('/tutors/by-id/:id', tutorsController.getTutorsById);
router.get('/tutors/student/:studentId', tutorsController.getTutorByStudent);
router.get('/tutors/year/:yearId', tutorsController.getTutorsByYear);

module.exports = router;