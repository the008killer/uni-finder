const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/twoFactorController');
const protect = require('../middleware/auth');

router.post('/setup', protect, ctrl.setup2FA);
router.post('/verify-setup', protect, ctrl.verify2FASetup);
router.post('/verify-login', ctrl.verify2FALogin);
router.post('/disable', protect, ctrl.disable2FA);

module.exports = router;