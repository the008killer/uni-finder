const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/programController');
router.get('/', ctrl.getPrograms);
router.get('/:id', ctrl.getProgramById);
module.exports = router;