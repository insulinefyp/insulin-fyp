const express = require('express');
const config = require('../config');
const glucoseController = require('../controllers/glucose.controller');
const validate = require('../middleware/validate');
const { protect, requireRole } = require('../middleware/protect');
const { simulatorControlSchema } = require('../validation/glucose.schema');

const router = express.Router();

router.use(protect, requireRole('patient'));

router.get('/current', glucoseController.getCurrent);

// Test controls are only mounted when enabled. When they are off, the
// routes do not exist at all rather than existing and refusing.
if (config.simulator.controlsEnabled) {
  router.get('/simulator', glucoseController.getSimulator);
  router.post(
    '/simulator',
    validate(simulatorControlSchema),
    glucoseController.setSimulator
  );
}

module.exports = router;
