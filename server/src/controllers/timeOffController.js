import timeOffService from '../services/timeOffService.js';

// =============================================================================
// ALLOCATIONS CONTROLLERS
// =============================================================================

/**
 * GET /api/time-off/allocations
 * List allocations with search, filters, and pagination
 */
export const getAllocations = async (req, res) => {
  try {
    const result = await timeOffService.getAllocations(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave allocations retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALLOCATION_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/time-off/allocations/my
 * Get current employee's own allocations
 */
export const getMyAllocations = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account'
      });
    }

    const query = { ...req.query, employee_id: req.user.employee_id };
    const result = await timeOffService.getAllocations(query, req.user);
    return res.status(200).json({
      success: true,
      message: 'My leave allocations retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALLOCATION_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/time-off/allocations/:id
 * Get single allocation by ID
 */
export const getAllocationById = async (req, res) => {
  try {
    const record = await timeOffService.getAllocationById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave allocation retrieved successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALLOCATION_FETCH_ERROR'
    });
  }
};

/**
 * POST /api/time-off/allocations
 * HR creates a new leave allocation
 */
export const createAllocation = async (req, res) => {
  try {
    const record = await timeOffService.createAllocation(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Leave allocation created successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALLOCATION_CREATE_ERROR'
    });
  }
};

/**
 * PATCH /api/time-off/allocations/:id/approve
 * HR approves a pending allocation
 */
export const approveAllocation = async (req, res) => {
  try {
    const record = await timeOffService.approveAllocation(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave allocation approved successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALLOCATION_APPROVE_ERROR'
    });
  }
};

/**
 * PATCH /api/time-off/allocations/:id/reject
 * HR rejects a pending allocation
 */
export const rejectAllocation = async (req, res) => {
  try {
    const record = await timeOffService.rejectAllocation(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave allocation rejected successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ALLOCATION_REJECT_ERROR'
    });
  }
};

// =============================================================================
// BALANCE CONTROLLERS
// =============================================================================

/**
 * GET /api/time-off/balance
 * Get authenticated user's own leave balance summary
 */
export const getMyBalance = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account'
      });
    }

    const result = await timeOffService.getEmployeeBalance(req.user.employee_id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave balance retrieved successfully',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'BALANCE_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/time-off/balance/:employeeId
 * HR view of an employee's leave balance summary
 */
export const getEmployeeBalance = async (req, res) => {
  try {
    const result = await timeOffService.getEmployeeBalance(req.params.employeeId, req.user);
    return res.status(200).json({
      success: true,
      message: 'Employee leave balance retrieved successfully',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'BALANCE_FETCH_ERROR'
    });
  }
};

// =============================================================================
// LEAVE REQUESTS CONTROLLERS
// =============================================================================

/**
 * GET /api/time-off/requests
 * List leave requests with filters and pagination
 */
export const getLeaveRequests = async (req, res) => {
  try {
    const result = await timeOffService.getLeaveRequests(req.query, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave requests retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/time-off/requests/my
 * Get current employee's own leave requests
 */
export const getMyLeaveRequests = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account'
      });
    }

    const query = { ...req.query, employee_id: req.user.employee_id };
    const result = await timeOffService.getLeaveRequests(query, req.user);
    return res.status(200).json({
      success: true,
      message: 'My leave requests retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/time-off/requests/:id
 * Get single leave request by ID
 */
export const getLeaveRequestById = async (req, res) => {
  try {
    const record = await timeOffService.getLeaveRequestById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave request retrieved successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_FETCH_ERROR'
    });
  }
};

/**
 * POST /api/time-off/requests
 * Submit a leave request (Employee or HR)
 */
export const createLeaveRequest = async (req, res) => {
  try {
    const record = await timeOffService.createLeaveRequest(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_CREATE_ERROR'
    });
  }
};

/**
 * PATCH /api/time-off/requests/:id/approve
 * HR approves a pending leave request (atomic with Knex transaction)
 */
export const approveLeaveRequest = async (req, res) => {
  try {
    const record = await timeOffService.approveLeaveRequest(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave request approved successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_APPROVE_ERROR'
    });
  }
};

/**
 * PATCH /api/time-off/requests/:id/reject
 * HR rejects a pending leave request
 */
export const rejectLeaveRequest = async (req, res) => {
  try {
    const record = await timeOffService.rejectLeaveRequest(
      req.params.id,
      req.user,
      req.body?.rejected_reason
    );
    return res.status(200).json({
      success: true,
      message: 'Leave request rejected successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_REJECT_ERROR'
    });
  }
};

/**
 * PATCH /api/time-off/requests/:id/cancel
 * Employee cancels their own pending leave request
 */
export const cancelLeaveRequest = async (req, res) => {
  try {
    const record = await timeOffService.cancelLeaveRequest(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: 'Leave request cancelled successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'REQUEST_CANCEL_ERROR'
    });
  }
};
