const express = require('express');
const router = express.Router();
const representativeAssignments = require('../controllers/parentAssignments.controller');

router.post('/representativeAssignments/create', representativeAssignments.createParentAssignment);
router.get('/representativeAssignments/list', representativeAssignments.getParentAssignments);
router.delete('/representativeAssignments/delete/:id', representativeAssignments.deleteParentAssignment);
router.put('/representativeAssignments/update/:id', representativeAssignments.updateParentAssignment);
router.get('/parentAssignments/by-user/:userId', representativeAssignments.getParentAssignmentByUser);

module.exports = router;