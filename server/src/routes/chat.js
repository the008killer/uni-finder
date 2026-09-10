const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chatController');
const protect = require('../middleware/auth');

router.get('/my-groups', protect, ctrl.getMyGroups);
router.post('/groups/:groupId/join', protect, ctrl.joinGroup);
router.get('/groups/:groupId/messages', protect, ctrl.getRoomMessages);
router.delete('/groups/:groupId/leave', protect, ctrl.leaveGroup);

module.exports = router;