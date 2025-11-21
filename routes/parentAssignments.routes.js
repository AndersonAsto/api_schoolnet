const express = require('express');
const router = express.Router();
const representativeAssignments = require('../controllers/parentAssignments.controller');

router.post('/representativeAssignments/create', representativeAssignments.createRepresentativesAssignments);
router.get('/representativeAssignments/list', representativeAssignments.getRepresentativesAssignments);
router.delete('/representativeAssignments/delete/:id', representativeAssignments.deleteParentsById);
router.put('/representativeAssignments/update/:id', representativeAssignments.updateParent);
router.get('/parentAssignments/by-user/:userId', representativeAssignments.getParentByUser);

module.exports = router;