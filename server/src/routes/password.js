const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/passwordController');

router.post('/forgot', ctrl.forgotPassword);
router.post('/reset/:token', ctrl.resetPassword);

module.exports = router;