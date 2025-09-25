const express = require('express');
const router = express.Router();
const yearsController = require('../controllers/years.controller');
const auth = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.post('/years/create', auth(), authorize(["Administrador"]), yearsController.createYear);
router.get('/years/list', auth(), yearsController.getYears);

module.exports = router;