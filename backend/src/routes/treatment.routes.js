const express = require('express');
const treatmentController = require('../controllers/treatment.controller');
const validate = require('../middleware/validate');
const { protect, requireRole } = require('../middleware/protect');
const { createTreatmentSchema } = require('../validation/treatment.schema');

const router = express.Router();

router.use(protect, requireRole('patient'));

router.get('/', treatmentController.getCurrent);
router.get('/limits', treatmentController.getLimits);
router.get('/history', treatmentController.getHistory);
router.post('/', validate(createTreatmentSchema), treatmentController.create);

// Deliberately absent: PUT, PATCH, DELETE. Versions are immutable.

module.exports = router;
