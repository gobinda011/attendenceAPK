const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const { loginSchema } = require('../validators/authValidator');

router.post('/login', validate(loginSchema), authController.login);
router.post('/setup-first-admin', authController.registerFirstAdmin); // one-time bootstrap

module.exports = router;
