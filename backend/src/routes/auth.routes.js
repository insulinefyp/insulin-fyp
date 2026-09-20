const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/protect');
const { registerSchema, loginSchema } = require('../validation/auth.schema');

const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', protect, authController.me);

module.exports = router;
