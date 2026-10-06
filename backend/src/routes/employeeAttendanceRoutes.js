const router = require('express').Router();

const employeeAttendanceController = require('../controllers/employeeAttendanceController');
const employeeAuthMiddleware = require('../middleware/employeeAuthMiddleware');
const employeeTwoFactorMiddleware = require('../middleware/employeeTwoFactorMiddleware');

// All employee attendance-information routes require
// an authenticated employee AND verified 2FA.
router.use(employeeAuthMiddleware);
router.use(employeeTwoFactorMiddleware);

router.get('/today', employeeAttendanceController.today);
router.get('/history', employeeAttendanceController.history);

module.exports = router;