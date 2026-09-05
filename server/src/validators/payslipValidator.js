/**
 * Middleware: Validate Payslip Generation for a Payrun
 */
export const validateGeneratePayslips = (req, res, next) => {
  const { payrun_id } = req.body;

  const errors = [];

  if (!payrun_id || !Number.isInteger(Number(payrun_id)) || Number(payrun_id) <= 0) {
    errors.push('payrun_id is required and must be a positive integer');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware: Validate Send Single Payslip Email
 */
export const validateSendPayslipEmail = (req, res, next) => {
  const { pdf_base64, pdf_filename } = req.body;

  const errors = [];

  if (pdf_base64 !== undefined && (typeof pdf_base64 !== 'string' || pdf_base64.trim().length === 0)) {
    errors.push('pdf_base64 must be a non-empty string if provided');
  }

  if (pdf_filename !== undefined && (typeof pdf_filename !== 'string' || pdf_filename.trim().length === 0)) {
    errors.push('pdf_filename must be a non-empty string if provided');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

/**
 * Middleware: Validate Bulk Send Payslips
 */
export const validateBulkSendPayslips = (req, res, next) => {
  const { payrun_id, employee_ids } = req.body;

  const errors = [];

  if (!payrun_id || !Number.isInteger(Number(payrun_id)) || Number(payrun_id) <= 0) {
    errors.push('payrun_id is required and must be a positive integer');
  }

  if (employee_ids !== undefined && (!Array.isArray(employee_ids) || employee_ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0))) {
    errors.push('employee_ids must be an array of positive integers if provided');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  next();
};

export default {
  validateGeneratePayslips,
  validateSendPayslipEmail,
  validateBulkSendPayslips
};
