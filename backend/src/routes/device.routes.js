const express = require('express');
const deviceController = require('../controllers/device.controller');
const { protect, requireRole } = require('../middleware/protect');

const router = express.Router();

router.use(protect, requireRole('patient'));

router.get('/', deviceController.getStatus);

module.exports = router;
