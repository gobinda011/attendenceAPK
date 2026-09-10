const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/authMiddleware');

router.use(auth);
router.get('/summary', dashboardController.summary);
router.get('/today', dashboardController.today);
router.get('/monthly', dashboardController.monthly);
router.get('/department', dashboardController.department);

module.exports = router;
