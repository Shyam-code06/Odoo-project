import { Router } from 'express';
import {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addScheduleDay,
  updateScheduleDay,
  deleteScheduleDay
} from '../controllers/scheduleController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateScheduleCreate,
  validateScheduleUpdate,
  validateScheduleDayCreate,
  validateScheduleDayUpdate
} from '../validators/scheduleValidator.js';

const router = Router();

// All schedule endpoints require authentication
router.use(authenticate);

// Read endpoints
router.get('/', getSchedules);
router.get('/:id', getScheduleById);

// Write endpoints (Restricted to Admin, HR Manager, HR Payroll Manager)
router.post(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateScheduleCreate,
  createSchedule
);

router.put(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateScheduleUpdate,
  updateSchedule
);

router.delete(
  '/:id',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  deleteSchedule
);

// Schedule Days Sub-resource routes
router.post(
  '/:id/days',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateScheduleDayCreate,
  addScheduleDay
);

router.put(
  '/:id/days/:dayId',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateScheduleDayUpdate,
  updateScheduleDay
);

router.delete(
  '/:id/days/:dayId',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  deleteScheduleDay
);

export default router;
