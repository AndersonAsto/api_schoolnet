const express = require('express');
const router = express.Router();
const representativeAssignments = require('../controllers/representativesAssignments.controller');

router.post('/representativeAssignments/create', representativeAssignments.createRepresentativesAssignments);
router.get('/representativeAssignments/list', representativeAssignments.getRepresentativesAssignments);
router.delete('/representativeAssignments/delete/:id', representativeAssignments.deleteParentsById);
router.put('/representativeAssignments/update/:id', representativeAssignments.updateParent);

module.exports = router;