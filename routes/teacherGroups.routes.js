const express = require('express');
const router = express.Router();
const teacherGruops = require('../controllers/teacherGroups.controller');

router.get('/teacherGroups/by-user/:userId/by-year/:yearId', teacherGruops.getTGroupsByUserYear);

module.exports = router;