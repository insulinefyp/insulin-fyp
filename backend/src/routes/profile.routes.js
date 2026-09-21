const express = require('express');
const profileController = require('../controllers/profile.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/protect');
const { updateProfileSchema } = require('../validation/profile.schema');

const router = express.Router();

router.use(protect);

router.get('/', profileController.getProfile);
router.patch('/', validate(updateProfileSchema), profileController.updateProfile);
router.get('/changes', profileController.getChangeHistory);

module.exports = router;
