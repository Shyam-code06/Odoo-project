import { Router } from 'express';
import {
  getDashboardSummary,
  getEmployeeDashboard,
  getOperationalAlerts
} from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateReportFilters } from '../validators/reportValidator.js';

const router = Router();

// All dashboard endpoints require authentication
router.use(authenticate);

// 1. Main HR & Payroll Live Dashboard (Admin, HR Manager, HR Payroll User, HR Payroll Manager)
router.get(
  '/summary',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  validateReportFilters,
  getDashboardSummary
);

// 2. Employee Self-Service Dashboard (Personal attendance, leaves, payslips)
router.get('/my', getEmployeeDashboard);

// 3. Operational Alerts
router.get(
  '/alerts',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  getOperationalAlerts
);

export default router;
