const router = require('express').Router();

const employeeAuthController = require('../controllers/employeeAuthController');
const employeeAuthMiddleware = require('../middleware/employeeAuthMiddleware');

// Employee login
router.post(
  '/login',
  employeeAuthController.login
);

// First-login password change
router.post(
  '/change-password',
  employeeAuthController.changePassword
);

router.get('/me', employeeAuthMiddleware, employeeAuthController.getProfile);

// Employee 2FA setup
router.post(
  '/2fa/setup',
  employeeAuthMiddleware,
  employeeAuthController.setupTwoFactor
);

// Verify authenticator code and enable 2FA
router.post(
  '/2fa/setup/verify',
  employeeAuthMiddleware,
  employeeAuthController.verifyTwoFactorSetup
);

// Verify TOTP during login
router.post(
  '/2fa/verify',
  employeeAuthController.verifyTwoFactorLogin
);

// Use recovery code during login
router.post(
  '/2fa/recovery',
  employeeAuthController.verifyTwoFactorRecovery
);

// Check current 2FA status
router.get(
  '/2fa/status',
  employeeAuthMiddleware,
  employeeAuthController.getTwoFactorStatus
);

// Disable 2FA
router.post(
  '/2fa/disable',
  employeeAuthMiddleware,
  employeeAuthController.disableTwoFactor
);

module.exports = router;