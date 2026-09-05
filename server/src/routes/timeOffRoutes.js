import { Router } from 'express';
import {
  getAllocations,
  getMyAllocations,
  getAllocationById,
  createAllocation,
  approveAllocation,
  rejectAllocation,
  getMyBalance,
  getEmployeeBalance,
  getLeaveRequests,
  getMyLeaveRequests,
  getLeaveRequestById,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest
} from '../controllers/timeOffController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateAllocationCreate,
  validateLeaveRequestCreate,
  validateLeaveRequestReject
} from '../validators/timeOffValidator.js';

const router = Router();

// All time-off endpoints require authentication
router.use(authenticate);

const HR_ROLES = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'];

// =============================================================================
// LEAVE BALANCES
// =============================================================================
router.get('/balance', getMyBalance);
router.get('/balance/:employeeId', authorize(...HR_ROLES), getEmployeeBalance);

// =============================================================================
// LEAVE ALLOCATIONS
// =============================================================================
router.get('/allocations/my', getMyAllocations);
router.get('/allocations', getAllocations);
router.get('/allocations/:id', getAllocationById);

// HR allocation creation & approval
router.post(
  '/allocations',
  authorize(...HR_ROLES),
  validateAllocationCreate,
  createAllocation
);

router.patch(
  '/allocations/:id/approve',
  authorize(...HR_ROLES),
  approveAllocation
);

router.patch(
  '/allocations/:id/reject',
  authorize(...HR_ROLES),
  rejectAllocation
);

// =============================================================================
// LEAVE REQUESTS
// =============================================================================
router.get('/requests/my', getMyLeaveRequests);
router.get('/requests', getLeaveRequests);
router.get('/requests/:id', getLeaveRequestById);

// Submit leave request (Employees & HR)
router.post(
  '/requests',
  validateLeaveRequestCreate,
  createLeaveRequest
);

// HR approvals & rejections
router.patch(
  '/requests/:id/approve',
  authorize(...HR_ROLES),
  approveLeaveRequest
);

router.patch(
  '/requests/:id/reject',
  authorize(...HR_ROLES),
  validateLeaveRequestReject,
  rejectLeaveRequest
);

// Employee self-service cancellation
router.patch(
  '/requests/:id/cancel',
  cancelLeaveRequest
);

export default router;
