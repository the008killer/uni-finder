const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/profileController');
const protect = require('../middleware/auth');

router.get('/', protect, ctrl.getProfile);
router.put('/', protect, ctrl.updateProfile);

module.exports = router;