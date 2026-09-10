const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/bookmarkController');
const protect = require('../middleware/auth');

router.post('/toggle/:programId', protect, ctrl.toggleBookmark);
router.get('/check/:programId', protect, ctrl.checkBookmarkStatus);
router.get('/my-ids', protect, ctrl.getMyBookmarkIds);
router.delete('/remove/:programId', protect, ctrl.removeBookmark);

module.exports = router;