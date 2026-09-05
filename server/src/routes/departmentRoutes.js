import { Router } from 'express';
import {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateDepartmentCreate,
  validateDepartmentUpdate
} from '../validators/departmentValidator.js';

const router = Router();

// All department endpoints require authentication
router.use(authenticate);

// Read endpoints: accessible by all authenticated roles (Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin)
router.get('/', getDepartments);
router.get('/:id', getDepartmentById);

// Write/Delete endpoints: restricted to Admin and HR Manager
router.post(
  '/',
  authorize('Admin', 'HR Manager'),
  validateDepartmentCreate,
  createDepartment
);

router.put(
  '/:id',
  authorize('Admin', 'HR Manager'),
  validateDepartmentUpdate,
  updateDepartment
);

router.delete(
  '/:id',
  authorize('Admin', 'HR Manager'),
  deleteDepartment
);

export default router;
