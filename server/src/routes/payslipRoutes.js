import { Router } from 'express';
import {
  generatePayslips,
  getPayslips,
  getMyPayslips,
  getPayslipById,
  sendSinglePayslipEmail,
  bulkSendPayslips
} from '../controllers/payslipController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateGeneratePayslips,
  validateSendPayslipEmail,
  validateBulkSendPayslips
} from '../validators/payslipValidator.js';

const router = Router();

// All payslip endpoints require authentication
router.use(authenticate);

// 1. Generate Payslips for a Payrun (HR Payroll User, HR Payroll Manager, Admin)
router.post(
  '/generate',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validateGeneratePayslips,
  generatePayslips
);

// 2. Convenience Self-Service endpoint: Get My Payslips (Employees)
router.get('/my', getMyPayslips);

// 3. List Payslips (Employees see only their own; HR Payroll / Admin see all)
router.get('/', getPayslips);

// 4. Get Single Payslip by ID with lines (Ownership enforced in service)
router.get('/:id', getPayslipById);

// 5. Send Individual Payslip Email
router.post(
  '/:id/send-email',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validateSendPayslipEmail,
  sendSinglePayslipEmail
);

// 6. Bulk-Send Payslip Emails for a Payrun
router.post(
  '/bulk-send-email',
  authorize('Admin', 'HR Payroll User', 'HR Payroll Manager'),
  validateBulkSendPayslips,
  bulkSendPayslips
);

export default router;
