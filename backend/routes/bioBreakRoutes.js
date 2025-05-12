const express = require('express');
const router = express.Router();
const bioBreakController = require('../controllers/bioBreakController');

router.get('/', bioBreakController.getBioBreaks);

module.exports = router;