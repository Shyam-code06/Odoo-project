import payslipService from '../services/payslipService.js';

/**
 * POST /api/payslips/generate
 * Generate payslips and lines snapshot from a computed/validated Payrun
 */
export const generatePayslips = async (req, res) => {
  try {
    const result = await payslipService.generatePayslipsForPayrun(req.body.payrun_id);
    return res.status(201).json({
      success: true,
      message: 'Payslips generated successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYSLIP_GENERATE_ERROR'
    });
  }
};

/**
 * GET /api/payslips
 * List payslips (HR/Admin can view all/filter; Employees only see their own)
 */
export const getPayslips = async (req, res) => {
  try {
    const result = await payslipService.getPayslips(req.query, req.user);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYSLIP_LIST_ERROR'
    });
  }
};

/**
 * GET /api/payslips/my
 * Convenience self-service endpoint for employees to view their own payslips
 */
export const getMyPayslips = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account.',
        code: 'NO_EMPLOYEE_PROFILE'
      });
    }

    const queryParams = {
      ...req.query,
      employee_id: req.user.employee_id
    };

    const result = await payslipService.getPayslips(queryParams, req.user);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'MY_PAYSLIPS_ERROR'
    });
  }
};

/**
 * GET /api/payslips/:id
 * Get single payslip by ID with all calculation line breakdown items
 */
export const getPayslipById = async (req, res) => {
  try {
    const payslip = await payslipService.getPayslipById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      data: payslip
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYSLIP_FETCH_ERROR'
    });
  }
};

/**
 * POST /api/payslips/:id/send-email
 * Send an individual payslip email to the employee (with optional frontend-generated PDF)
 */
export const sendSinglePayslipEmail = async (req, res) => {
  try {
    const result = await payslipService.sendSinglePayslipEmail(
      req.params.id,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYSLIP_EMAIL_ERROR'
    });
  }
};

/**
 * POST /api/payslips/bulk-send-email
 * Bulk-send payslips for all or selected employees in a Payrun
 */
export const bulkSendPayslips = async (req, res) => {
  try {
    const result = await payslipService.bulkSendPayrunPayslips(req.body);
    return res.status(200).json({
      success: true,
      message: `Bulk email dispatch completed. ${result.successful_count} sent, ${result.failed_count} failed.`,
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'BULK_EMAIL_ERROR'
    });
  }
};

export default {
  generatePayslips,
  getPayslips,
  getMyPayslips,
  getPayslipById,
  sendSinglePayslipEmail,
  bulkSendPayslips
};
