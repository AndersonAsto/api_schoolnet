const express = require('express');
const router = express.Router();
const sectionsController = require('../controllers/sections.controller');

router.post('/sections/create', sectionsController.createSection);
router.get('/sections/list', sectionsController.getSections);
router.put('/sections/update/:id', sectionsController.updateSection);
router.delete('/sections/delete/:id', sectionsController.deleteSectionById);

module.exports = router;