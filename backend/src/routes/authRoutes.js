const router = require('express').Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const { loginSchema } = require('../validators/authValidator');
//new import for 2FA setup
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', validate(loginSchema), authController.login);


router.post(
  '/2fa/verify',
  authController.verifyTwoFactorLogin
);


router.post(
  '/2fa/setup',
  authMiddleware,
  authController.setupTwoFactor
);
//new update for 2FA setup verification route
router.post(
  '/2fa/setup/verify',
  authMiddleware,
  authController.verifyTwoFactorSetup
);

//update to get 2fa on off status 
router.get(
  '/2fa/status',
  authMiddleware,
  authController.getTwoFactorStatus
);

//new update to disable 2FA route
router.post(
  '/2fa/disable',
  authMiddleware,
  authController.disableTwoFactor
);

router.post('/setup-first-admin', authController.registerFirstAdmin); // one-time bootstrap

module.exports = router;
