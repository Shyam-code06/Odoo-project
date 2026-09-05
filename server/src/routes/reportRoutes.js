import { Router } from 'express';
import {
  getEmployeeReport,
  getAttendanceReport,
  getTimeOffReport,
  getPayrollReport
} from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import { validateReportFilters } from '../validators/reportValidator.js';

const router = Router();

// All report endpoints require authentication
router.use(authenticate);

// 1. Employee Headcount & Demographics Report (Admin, HR Manager, HR Payroll User, HR Payroll Manager)
router.get(
  '/employees',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  validateReportFilters,
  getEmployeeReport
);

// 2. Attendance & Working Hours Report (Admin, HR Manager, HR Payroll User, HR Payroll Manager)
router.get(
  '/attendance',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  validateReportFilters,
  getAttendanceReport
);

// 3. Time-Off / Leave Utilization Report (Admin, HR Manager, HR Payroll User, HR Payroll Manager)
router.get(
  '/time-off',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  validateReportFilters,
  getTimeOffReport
);

// 4. Payroll & Salary Expenditure Report (Admin, HR Payroll User, HR Payroll Manager)
// Note: HR Manager role does not have access to company-wide financial payroll reports
router.get(
  '/payroll',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validateReportFilters,
  getPayrollReport
);

export default router;
