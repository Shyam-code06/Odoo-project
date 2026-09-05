import { Router } from 'express';
import {
  getJobPositions,
  getJobPositionById,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition
} from '../controllers/jobPositionController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateJobPositionCreate,
  validateJobPositionUpdate
} from '../validators/jobPositionValidator.js';

const router = Router();

// All job position endpoints require authentication
router.use(authenticate);

// Read endpoints: accessible by all authenticated roles
router.get('/', getJobPositions);
router.get('/:id', getJobPositionById);

// Write/Delete endpoints: restricted to Admin and HR Manager
router.post(
  '/',
  authorize('Admin', 'HR Manager'),
  validateJobPositionCreate,
  createJobPosition
);

router.put(
  '/:id',
  authorize('Admin', 'HR Manager'),
  validateJobPositionUpdate,
  updateJobPosition
);

router.delete(
  '/:id',
  authorize('Admin', 'HR Manager'),
  deleteJobPosition
);

export default router;
