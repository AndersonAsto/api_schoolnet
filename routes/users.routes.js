const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users.controller');

router.post('/users/create', usersController.createUser);
router.get('/users/list', usersController.getUsers);
router.get('/users/byRole/:role', usersController.getUsersByRole);
router.put('/users/update/:id', usersController.updateUser);
router.delete('/users/delete/:id', usersController.deleteStudent);

module.exports = router;