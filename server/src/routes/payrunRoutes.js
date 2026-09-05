import { Router } from 'express';
import {
  getEligibleEmployees,
  createPayrun,
  getPayruns,
  getPayrunById,
  addEmployees,
  removeEmployee,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  cancelPayrun,
  deletePayrun
} from '../controllers/payrunController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateEligibleEmployees,
  validatePayrunCreate,
  validateAddEmployees
} from '../validators/payrunValidator.js';

const router = Router();

// All payrun endpoints require authentication
router.use(authenticate);

// 1. Step 1: Query Eligible Employees (HR Payroll User, HR Payroll Manager, Admin)
router.post(
  '/eligible-employees',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validateEligibleEmployees,
  getEligibleEmployees
);

// 2. Step 2: Create Payrun (HR Payroll User, HR Payroll Manager, Admin)
router.post(
  '/',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validatePayrunCreate,
  createPayrun
);

// 3. List Payruns (HR Payroll User, HR Payroll Manager, Admin)
router.get(
  '/',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  getPayruns
);

// 4. Get Payrun Details by ID (HR Payroll User, HR Payroll Manager, Admin)
router.get(
  '/:id',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  getPayrunById
);

// 5. Add / Remove Employees to DRAFT Payrun (HR Payroll User, HR Payroll Manager, Admin)
router.post(
  '/:id/employees',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validateAddEmployees,
  addEmployees
);

router.delete(
  '/:id/employees/:employeeId',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  removeEmployee
);

// 6. Action: Compute Payrun (HR Payroll User, HR Payroll Manager, Admin)
router.post(
  '/:id/compute',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  computePayrun
);

// 7. Action: Validate Payrun (Restricted to HR Payroll Manager & Admin)
router.post(
  '/:id/validate',
  authorize('Admin', 'HR Payroll Manager'),
  validatePayrun
);

// 8. Action: Mark Payrun Paid (Restricted to HR Payroll Manager & Admin)
router.post(
  '/:id/mark-paid',
  authorize('Admin', 'HR Payroll Manager'),
  markPayrunPaid
);

// 9. Action: Cancel Payrun (HR Payroll Manager & Admin)
router.post(
  '/:id/cancel',
  authorize('Admin', 'HR Payroll Manager'),
  cancelPayrun
);

// 10. Delete Payrun (Restricted to HR Payroll Manager & Admin)
router.delete(
  '/:id',
  authorize('Admin', 'HR Payroll Manager'),
  deletePayrun
);

export default router;
