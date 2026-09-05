import { Router } from 'express';
import {
  getTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  updateStatus,
  deleteTimeOffType
} from '../controllers/timeOffTypeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateTimeOffTypeCreate,
  validateTimeOffTypeUpdate,
  validateTimeOffTypeStatus
} from '../validators/timeOffTypeValidator.js';

const router = Router();

// All time off type endpoints require authentication
router.use(authenticate);

// Read endpoints: accessible by all authenticated roles
router.get('/', getTimeOffTypes);
router.get('/:id', getTimeOffTypeById);

// Write/Delete endpoints: restricted to Admin and HR Manager
router.post(
  '/',
  authorize('Admin', 'HR Manager'),
  validateTimeOffTypeCreate,
  createTimeOffType
);

// Full or partial update
router.put(
  '/:id',
  authorize('Admin', 'HR Manager'),
  validateTimeOffTypeUpdate,
  updateTimeOffType
);

// Dedicated status activation/deactivation route (also supports standard PATCH)
router.patch(
  '/:id/status',
  authorize('Admin', 'HR Manager'),
  validateTimeOffTypeStatus,
  updateStatus
);

router.patch(
  '/:id',
  authorize('Admin', 'HR Manager'),
  validateTimeOffTypeUpdate,
  updateTimeOffType
);

router.delete(
  '/:id',
  authorize('Admin', 'HR Manager'),
  deleteTimeOffType
);

export default router;
