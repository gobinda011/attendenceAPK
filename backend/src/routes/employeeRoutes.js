const router = require('express').Router();
const employeeController = require('../controllers/employeeController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validationMiddleware');
const { createEmployeeSchema, updateEmployeeSchema } = require('../validators/employeeValidator');

// Every employee-management route requires an authenticated admin (FR-001).
router.use(auth);

router.get('/', employeeController.list);
router.post('/', validate(createEmployeeSchema), employeeController.create);
router.get('/:id', employeeController.getOne);
router.put('/:id', validate(updateEmployeeSchema), employeeController.update);
router.delete('/:id', employeeController.remove); // => deactivate (Rule 9)

// FR-003: Face Registration
router.post('/:id/register-face', upload.single('image'), employeeController.registerFace);

module.exports = router;
