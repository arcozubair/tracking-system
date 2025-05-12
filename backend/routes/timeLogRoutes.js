const express = require('express');
const router = express.Router();
const timeLogController = require('../controllers/timeLogController');

router.post('/login', timeLogController.logIn);
router.post('/logout', timeLogController.logOut);
router.post('/break/start', timeLogController.startBreak);
router.post('/break/end', timeLogController.endBreak);
router.get('/status', timeLogController.getTimeLogStatus);

module.exports = router;