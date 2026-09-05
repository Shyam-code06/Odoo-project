import { Router } from 'express';
import {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyAttendance,
  getAttendanceList,
  getAttendanceById,
  createManualAttendance,
  correctAttendance,
  deleteAttendance
} from '../controllers/attendanceController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateCheckIn,
  validateCheckOut,
  validateAttendanceCorrection,
  validateManualAttendanceCreate
} from '../validators/attendanceValidator.js';

const router = Router();

// All attendance endpoints require authentication
router.use(authenticate);

// 1. Employee Self-Service Attendance Endpoints (with GPS on-site verification)
router.post('/check-in', validateCheckIn, checkIn);
router.post('/check-out', validateCheckOut, checkOut);
router.get('/today', getTodayStatus);
router.get('/my', getMyAttendance);

// 2. HR & Management Attendance Listing
router.get(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll User', 'HR Payroll Manager'),
  getAttendanceList
);

// 3. Single Record View (Ownership checked in controller)
router.get('/:id', getAttendanceById);

// 4. Manual Creation & Corrections (Restricted to HR / Admin)
router.post(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateManualAttendanceCreate,
  createManualAttendance
);

router.put(
  '/:id/correct',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateAttendanceCorrection,
  correctAttendance
);

router.patch(
  '/:id/correct',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateAttendanceCorrection,
  correctAttendance
);

// 5. Delete Attendance
router.delete(
  '/:id',
  authorize('Admin', 'HR Manager'),
  deleteAttendance
);

export default router;
