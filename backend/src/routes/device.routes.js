const express = require('express');
const deviceController = require('../controllers/device.controller');
const { protect, requireRole } = require('../middleware/protect');

const router = express.Router();

router.use(protect, requireRole('patient'));

router.get('/', deviceController.getStatus);
router.get('/temperature/history', deviceController.getTemperatureHistory);
router.get('/temperature/excursions', deviceController.getTemperatureExcursions);

module.exports = router;
