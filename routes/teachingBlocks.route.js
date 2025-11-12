const express = require('express');
const router = express.Router();
const teachingBlocksController = require('../controllers/teachingBlocks.controller');

router.post('/teachingBlocks/create', teachingBlocksController.createTeachingBlock);
router.get('/teachingBlocks/list', teachingBlocksController.getTeachingBlocks);
router.get('/teachingBlocks/byYear/:yearId', teachingBlocksController.getBlocksByYear);
router.delete('/teachingBlocks/delete/:id', teachingBlocksController.deteleTeachingBlockById);
router.put('/teachingBlocks/update/:id', teachingBlocksController.updateTeachingBlock);

module.exports = router;