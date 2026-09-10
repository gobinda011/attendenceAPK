const router = require('express').Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validationMiddleware');
const { updateAttendanceSchema } = require('../validators/attendanceValidator');

// Employee-facing routes: NO authentication (employees have no accounts),
// but rate-limited at the app level and gated entirely by face verification.
router.post('/verify', upload.single('image'), attendanceController.verify);
router.post('/check-in', upload.single('image'), attendanceController.checkIn);
router.post('/check-out', upload.single('image'), attendanceController.checkOut);

// Admin-facing routes: require authentication.
router.get('/', auth, attendanceController.list);
router.get('/today', auth, attendanceController.today);
router.get('/employee/:employeeId', auth, attendanceController.byEmployee);
router.put('/:id', auth, validate(updateAttendanceSchema), attendanceController.update);

module.exports = router;
