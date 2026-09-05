import payrollCalculationService from '../services/payrollCalculationService.js';

/**
 * POST /api/payroll/calculate
 * Calculate full salary breakdown for an employee for a payroll period
 */
export const calculatePayroll = async (req, res) => {
  try {
    const isHrOrAdmin = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'].includes(
      (req.user.role_code || req.user.role_name || '').toUpperCase().replace(/\s+/g, '_')
    );

    const targetEmployeeId = Number(req.body.employee_id);

    // Normal employees can only calculate/view their own payroll preview
    if (!isHrOrAdmin && req.user.employee_id !== targetEmployeeId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to calculate payroll for another employee.',
        code: 'FORBIDDEN'
      });
    }

    const result = await payrollCalculationService.calculateEmployeePayroll(req.body);

    return res.status(200).json({
      success: true,
      message: 'Payroll calculated successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'PAYROLL_CALCULATION_ERROR'
    });
  }
};

/**
 * POST /api/payroll/simulate
 * Interactive simulation of salary rules and hypothetical parameters
 */
export const simulatePayroll = async (req, res) => {
  try {
    const result = await payrollCalculationService.simulatePayroll(req.body);

    return res.status(200).json({
      success: true,
      message: 'Payroll simulation executed successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'SIMULATION_ERROR'
    });
  }
};

/**
 * POST /api/payroll/calculate-batch-preview
 * Batch preview of payroll calculations for multiple active employees
 */
export const calculateBatchPreview = async (req, res) => {
  try {
    const result = await payrollCalculationService.calculateBatchPreview(req.body);

    return res.status(200).json({
      success: true,
      message: 'Batch payroll preview generated successfully.',
      data: result
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'BATCH_PAYROLL_ERROR'
    });
  }
};

export default {
  calculatePayroll,
  simulatePayroll,
  calculateBatchPreview
};
