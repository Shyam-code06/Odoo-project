import { Router } from 'express';
import {
  getRules,
  getRuleById,
  createRule,
  updateRule,
  updateRuleStatus,
  deleteRule
} from '../controllers/salaryConfigurationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateSalaryRuleCreate,
  validateSalaryRuleUpdate
} from '../validators/salaryConfigurationValidator.js';

const router = Router();

// All salary rule endpoints require authentication
router.use(authenticate);

// Permitted roles
const READ_ROLES = ['Admin', 'HR Payroll Manager', 'HR Payroll User'];
const WRITE_ROLES = ['Admin', 'HR Payroll Manager'];

// Read endpoints
router.get('/', authorize(...READ_ROLES), getRules);
router.get('/:id', authorize(...READ_ROLES), getRuleById);

// Write endpoints (Admin & HR Payroll Manager)
router.post(
  '/',
  authorize(...WRITE_ROLES),
  validateSalaryRuleCreate,
  createRule
);

router.put(
  '/:id',
  authorize(...WRITE_ROLES),
  validateSalaryRuleUpdate,
  updateRule
);

router.patch(
  '/:id/status',
  authorize(...WRITE_ROLES),
  updateRuleStatus
);

router.delete(
  '/:id',
  authorize('Admin'),
  deleteRule
);

export default router;
