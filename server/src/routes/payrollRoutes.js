import { Router } from 'express';
import {
  calculatePayroll,
  simulatePayroll,
  calculateBatchPreview
} from '../controllers/payrollCalculationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateCalculatePayroll,
  validateSimulatePayroll,
  validateBatchPayroll
} from '../validators/payrollValidator.js';
import payrollAnalyticsRoutes from './payrollAnalyticsRoutes.js';

const router = Router();

// All payroll calculation endpoints require authentication
router.use(authenticate);

// 0. Payroll Analytics (Admin & HR only)
router.use('/analytics', payrollAnalyticsRoutes);

// 1. Calculate Single Employee Payroll
// Employees can calculate their own preview; HR/Payroll/Admin can calculate for any employee
router.post(
  '/calculate',
  validateCalculatePayroll,
  calculatePayroll
);

// 2. Interactive Payroll Simulation (HR / Payroll User / Payroll Manager / Admin)
router.post(
  '/simulate',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  validateSimulatePayroll,
  simulatePayroll
);

// 3. Batch Preview (HR / Payroll User / Payroll Manager / Admin)
router.post(
  '/calculate-batch-preview',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  validateBatchPayroll,
  calculateBatchPreview
);

export default router;
