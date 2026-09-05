import { Router } from 'express';
import {
  getContracts,
  getContractById,
  getApplicableContract,
  createContract,
  updateContract,
  updateContractStatus
} from '../controllers/contractController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateContractCreate,
  validateContractUpdate,
  validateContractStatus
} from '../validators/contractValidator.js';

const router = Router();

// All contract endpoints require authentication
router.use(authenticate);

// Special / helper endpoints (must come before /:id)
router.get('/applicable', getApplicableContract);

// Read endpoints
router.get('/', getContracts);
router.get('/:id', getContractById);

// Write endpoints (Restricted to Admin, HR Manager, HR Payroll Manager)
router.post(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateContractCreate,
  createContract
);

router.put(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateContractUpdate,
  updateContract
);

router.patch(
  '/:id/status',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateContractStatus,
  updateContractStatus
);

export default router;
