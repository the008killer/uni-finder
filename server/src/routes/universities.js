const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/uniController');
router.get('/', ctrl.getUniversities);
router.get('/:id', ctrl.getUniversityById);
module.exports = router;