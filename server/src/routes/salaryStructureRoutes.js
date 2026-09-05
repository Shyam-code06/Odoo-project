import { Router } from 'express';
import {
  getStructures,
  getStructureById,
  createStructure,
  updateStructure,
  updateStructureStatus,
  deleteStructure,
  getRulesForStructure,
  createRuleForStructure
} from '../controllers/salaryConfigurationController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateSalaryStructureCreate,
  validateSalaryStructureUpdate,
  validateSalaryRuleCreate
} from '../validators/salaryConfigurationValidator.js';

const router = Router();

// All salary structure endpoints require authentication
router.use(authenticate);

// Permitted roles
const READ_ROLES = ['Admin', 'HR Payroll Manager', 'HR Payroll User'];
const WRITE_ROLES = ['Admin', 'HR Payroll Manager'];

// Read endpoints
router.get('/', authorize(...READ_ROLES), getStructures);
router.get('/:id', authorize(...READ_ROLES), getStructureById);
router.get('/:id/rules', authorize(...READ_ROLES), getRulesForStructure);

// Write endpoints (Admin & HR Payroll Manager)
router.post(
  '/',
  authorize(...WRITE_ROLES),
  validateSalaryStructureCreate,
  createStructure
);

router.put(
  '/:id',
  authorize(...WRITE_ROLES),
  validateSalaryStructureUpdate,
  updateStructure
);

router.patch(
  '/:id/status',
  authorize(...WRITE_ROLES),
  updateStructureStatus
);

router.post(
  '/:id/rules',
  authorize(...WRITE_ROLES),
  validateSalaryRuleCreate,
  createRuleForStructure
);

router.delete(
  '/:id',
  authorize('Admin'),
  deleteStructure
);

export default router;
