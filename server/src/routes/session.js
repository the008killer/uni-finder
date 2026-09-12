const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/sessionController');

router.post('/', ctrl.createSession);

module.exports = router;