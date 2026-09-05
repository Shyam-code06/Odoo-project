import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateEmployeeStatus
} from '../validators/employeeValidator.js';

const router = Router();

// All employee endpoints require authentication
router.use(authenticate);

// Read endpoints: accessible by all authenticated roles (Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin)
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);

// Write endpoints: restricted to HR Manager, HR Payroll Manager, Admin
router.post(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateEmployeeCreate,
  createEmployee
);

router.put(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateEmployeeUpdate,
  updateEmployee
);

router.patch(
  '/:id/status',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateEmployeeStatus,
  updateEmployeeStatus
);

// Delete endpoint: restricted to Admin and HR Manager
router.delete(
  '/:id',
  authorize('Admin', 'HR Manager'),
  deleteEmployee
);

export default router;
