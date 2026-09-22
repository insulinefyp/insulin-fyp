const express = require('express');
const config = require('../config');
const glucoseController = require('../controllers/glucose.controller');
const validate = require('../middleware/validate');
const validateQuery = require('../middleware/validateQuery');
const { protect, requireRole } = require('../middleware/protect');
const {
  simulatorControlSchema,
  historyQuerySchema,
} = require('../validation/glucose.schema');

const router = express.Router();

router.use(protect, requireRole('patient'));

router.get('/current', glucoseController.getCurrent);
router.get('/ranges', glucoseController.getRanges);
router.get('/history', validateQuery(historyQuerySchema), glucoseController.getHistory);

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
