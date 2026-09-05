import { Router } from 'express';
import {
  getSalaryRuleCategories,
  getSalaryRuleCategoryById,
  createSalaryRuleCategory,
  updateSalaryRuleCategory,
  deleteSalaryRuleCategory
} from '../controllers/salaryRuleCategoryController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateSalaryRuleCategoryCreate,
  validateSalaryRuleCategoryUpdate
} from '../validators/salaryRuleCategoryValidator.js';

const router = Router();

// All salary rule category endpoints require authentication
router.use(authenticate);

// Read endpoints: accessible by all authenticated roles
router.get('/', getSalaryRuleCategories);
router.get('/:id', getSalaryRuleCategoryById);

// Write/Delete endpoints: restricted to Admin, HR Manager, and HR Payroll Manager
router.post(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateSalaryRuleCategoryCreate,
  createSalaryRuleCategory
);

router.put(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateSalaryRuleCategoryUpdate,
  updateSalaryRuleCategory
);

router.delete(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  deleteSalaryRuleCategory
);

export default router;
