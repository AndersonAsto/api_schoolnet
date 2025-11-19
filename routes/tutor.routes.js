const express = require('express');
const router = express.Router();
const tutorsController = require('../controllers/tutors.controller');

router.post('/tutors/create', tutorsController.createTutor);
router.get('/tutors/list', tutorsController.getTutors);
router.get('/tutors/by-id/:id', tutorsController.getTutorsById);
router.put('/tutors/update/:id', tutorsController.updateTutor);
router.delete('/tutors/delete/:id', tutorsController.deleteTutor);

module.exports = router;