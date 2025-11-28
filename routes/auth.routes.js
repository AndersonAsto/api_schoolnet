const express = require("express");
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {body} = require("express-validator");
const {validationResult} = require("express-validator");

function validate(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()});
    next();
}

router.post(
    "/login",
    [
        body("username").isString().notEmpty(),
        body("password").isString().isLength({min: 6}),
    ],
    validate,
    authController.login
);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);

module.exports = router;
