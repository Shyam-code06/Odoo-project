import { Router } from 'express';
import {
  getSalaryCostByDepartment,
  getMonthlyNetSalaryTrends
} from '../controllers/payrollAnalyticsController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// All analytics endpoints require authentication and Admin/HR role authorization
router.use(authenticate);
router.use(authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'));

// 1. Historical Salary Cost Grouped by Department
router.get('/salary-cost-by-department', getSalaryCostByDepartment);

// 2. Historical Monthly Net Salary Trends
router.get('/monthly-net-salary', getMonthlyNetSalaryTrends);

export default router;
