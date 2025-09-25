const express = require('express');
const router = express.Router();
const personsController = require('../controllers/persons.controller');

router.post('/persons/create', personsController.createPerson);
router.get('/persons/list', personsController.getPersons);
router.get('/persons/byRole/:role', personsController.getPersonsByRole);
router.get('/persons/byPrivilegien', personsController.getPersonsByPrivilegien);
router.put('/persons/update/:id', personsController.updatePerson);
router.delete('/persons/delete/:id', personsController.deletePersonById);

module.exports = router;