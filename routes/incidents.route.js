const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');

router.post('/incidents/create', incidentsController.createIncident);
router.get('/incidents/list', incidentsController.getAllIncidents);
router.get('/incidents/byStudentAndSchedule/:studentId/:scheduleId', incidentsController.getByStudentAndSchedule);
router.delete('/incidents/delete/:id', incidentsController.deleteIncidentById);

module.exports = router;