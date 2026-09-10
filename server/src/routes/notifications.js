const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/notificationController');
const protect = require('../middleware/auth');

router.get('/', protect, ctrl.getNotifications);
router.get('/unread-count', protect, ctrl.getUnreadCount);
router.put('/mark-read', protect, ctrl.markAllRead);

module.exports = router;