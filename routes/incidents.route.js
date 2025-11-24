const express = require('express');
const router = express.Router();
const incidentsController = require('../controllers/incidents.controller');

router.post('/incidents/create', incidentsController.createIncident);
router.get('/incidents/list', incidentsController.getIncidents);
router.get('/incidents/byStudentAndSchedule/:studentId/:scheduleId', incidentsController.getIncidentsByScheduleAndStudent);
router.delete('/incidents/delete/:id', incidentsController.deleteIncident);
router.put('/incidents/update/:id', incidentsController.updateIncident);

module.exports = router;