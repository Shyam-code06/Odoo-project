import payrunService from '../services/payrunService.js';

/**
 * POST /api/payruns/eligible-employees
 * Step 1: Query eligible employees for a period and salary structure
 */
export const getEligibleEmployees = async (req, res) => {
  try {
    const result = await payrunService.getEligibleEmployees(req.body);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'ELIGIBILITY_ERROR'
    });
  }
};

/**
 * POST /api/payruns
 * Step 2: Create a new Payrun in DRAFT status with selected employees
 */
export const createPayrun = async (req, res) => {
  try {
    const created = await payrunService.createPayrun(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Payrun created successfully in DRAFT status.',
      data: created
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_CREATE_ERROR',
      errors: err.errors || undefined
    });
  }
};

/**
 * GET /api/payruns
 * List Payruns with filters, pagination, and sorting
 */
export const getPayruns = async (req, res) => {
  try {
    const result = await payrunService.getPayruns(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_LIST_ERROR'
    });
  }
};

/**
 * GET /api/payruns/:id
 * Get single Payrun details with joined employee rows
 */
export const getPayrunById = async (req, res) => {
  try {
    const payrun = await payrunService.getPayrunById(req.params.id);
    return res.status(200).json({
      success: true,
      data: payrun
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_FETCH_ERROR'
    });
  }
};

/**
 * POST /api/payruns/:id/employees
 * Add employees to a DRAFT payrun
 */
export const addEmployees = async (req, res) => {
  try {
    const updated = await payrunService.addEmployeesToPayrun(req.params.id, req.body.employee_ids);
    return res.status(200).json({
      success: true,
      message: 'Employees added to payrun successfully.',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_EMPLOYEE_ADD_ERROR'
    });
  }
};

/**
 * DELETE /api/payruns/:id/employees/:employeeId
 * Remove an employee from a DRAFT payrun
 */
export const removeEmployee = async (req, res) => {
  try {
    const updated = await payrunService.removeEmployeeFromPayrun(
      req.params.id,
      req.params.employeeId
    );
    return res.status(200).json({
      success: true,
      message: 'Employee removed from payrun successfully.',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_EMPLOYEE_REMOVE_ERROR'
    });
  }
};

/**
 * POST /api/payruns/:id/compute
 * Execute computation for all assigned employees
 */
export const computePayrun = async (req, res) => {
  try {
    const result = await payrunService.computePayrun(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Payrun computation completed.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_COMPUTE_ERROR'
    });
  }
};

/**
 * POST /api/payruns/:id/validate
 * Validate computed payrun and check for duplicates
 */
export const validatePayrun = async (req, res) => {
  try {
    const result = await payrunService.validatePayrun(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Payrun validated successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_VALIDATE_ERROR'
    });
  }
};

/**
 * POST /api/payruns/:id/mark-paid
 * Mark validated payrun as paid/disbursed
 */
export const markPayrunPaid = async (req, res) => {
  try {
    const result = await payrunService.markPayrunPaid(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Payrun marked as paid successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_MARK_PAID_ERROR'
    });
  }
};

/**
 * POST /api/payruns/:id/cancel
 * Cancel a draft or computed payrun
 */
export const cancelPayrun = async (req, res) => {
  try {
    const result = await payrunService.cancelPayrun(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Payrun cancelled successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_CANCEL_ERROR'
    });
  }
};

/**
 * DELETE /api/payruns/:id
 * Delete a draft or cancelled payrun
 */
export const deletePayrun = async (req, res) => {
  try {
    await payrunService.deletePayrun(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Payrun deleted successfully.'
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYRUN_DELETE_ERROR'
    });
  }
};

export default {
  getEligibleEmployees,
  createPayrun,
  getPayruns,
  getPayrunById,
  addEmployees,
  removeEmployee,
  computePayrun,
  validatePayrun,
  markPayrunPaid,
  cancelPayrun,
  deletePayrun
};
