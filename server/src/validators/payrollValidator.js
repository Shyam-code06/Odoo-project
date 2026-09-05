const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate date format YYYY-MM-DD
 */
const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) return false;
  const d = new Date(dateStr);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Middleware: Validate Calculate Employee Payroll request
 */
export const validateCalculatePayroll = (req, res, next) => {
  const {
    employee_id,
    period_start,
    period_end,
    salary_structure_id,
    contract_id
  } = req.body;

  const errors = [];

  // Employee ID
  if (!employee_id || !Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0) {
    errors.push('employee_id is required and must be a positive integer');
  }

  // Period Start
  if (!period_start || !isValidDate(period_start)) {
    errors.push('period_start is required and must be in YYYY-MM-DD format');
  }

  // Period End
  if (!period_end || !isValidDate(period_end)) {
    errors.push('period_end is required and must be in YYYY-MM-DD format');
  } else if (isValidDate(period_start) && new Date(period_end) < new Date(period_start)) {
    errors.push('period_end cannot be earlier than period_start');
  }

  // Optional Salary Structure Override
  if (salary_structure_id !== undefined && salary_structure_id !== null && salary_structure_id !== '') {
    if (!Number.isInteger(Number(salary_structure_id)) || Number(salary_structure_id) <= 0) {
      errors.push('salary_structure_id must be a positive integer if provided');
    }
  }

  // Optional Contract Override
  if (contract_id !== undefined && contract_id !== null && contract_id !== '') {
    if (!Number.isInteger(Number(contract_id)) || Number(contract_id) <= 0) {
      errors.push('contract_id must be a positive integer if provided');
    }
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
 * Middleware: Validate Payroll Simulation request
 */
export const validateSimulatePayroll = (req, res, next) => {
  const {
    wage,
    salary_structure_id,
    rules,
    period_start,
    period_end,
    worked_days,
    scheduled_days,
    unpaid_leaves
  } = req.body;

  const errors = [];

  // Wage
  if (wage === undefined || wage === null || isNaN(Number(wage)) || Number(wage) < 0) {
    errors.push('wage is required and must be a non-negative number');
  }

  // Either salary_structure_id or rules array must be provided
  if (!salary_structure_id && (!rules || !Array.isArray(rules) || rules.length === 0)) {
    errors.push('Either salary_structure_id or a rules array must be provided for simulation');
  }

  // Dates
  if (period_start && !isValidDate(period_start)) {
    errors.push('period_start must be in YYYY-MM-DD format');
  }

  if (period_end && !isValidDate(period_end)) {
    errors.push('period_end must be in YYYY-MM-DD format');
  } else if (period_start && period_end && isValidDate(period_start) && isValidDate(period_end)) {
    if (new Date(period_end) < new Date(period_start)) {
      errors.push('period_end cannot be earlier than period_start');
    }
  }

  // Numeric overrides
  if (worked_days !== undefined && (isNaN(Number(worked_days)) || Number(worked_days) < 0)) {
    errors.push('worked_days must be a non-negative number');
  }

  if (scheduled_days !== undefined && (isNaN(Number(scheduled_days)) || Number(scheduled_days) < 0)) {
    errors.push('scheduled_days must be a non-negative number');
  }

  if (unpaid_leaves !== undefined && (isNaN(Number(unpaid_leaves)) || Number(unpaid_leaves) < 0)) {
    errors.push('unpaid_leaves must be a non-negative number');
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
 * Middleware: Validate Batch Payroll Calculation request
 */
export const validateBatchPayroll = (req, res, next) => {
  const {
    period_start,
    period_end,
    employee_ids,
    department_id
  } = req.body;

  const errors = [];

  // Period Start
  if (!period_start || !isValidDate(period_start)) {
    errors.push('period_start is required and must be in YYYY-MM-DD format');
  }

  // Period End
  if (!period_end || !isValidDate(period_end)) {
    errors.push('period_end is required and must be in YYYY-MM-DD format');
  } else if (isValidDate(period_start) && new Date(period_end) < new Date(period_start)) {
    errors.push('period_end cannot be earlier than period_start');
  }

  // Employee IDs if specified
  if (employee_ids !== undefined && (!Array.isArray(employee_ids) || employee_ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0))) {
    errors.push('employee_ids must be an array of positive integers if provided');
  }

  // Department ID if specified
  if (department_id !== undefined && department_id !== null && department_id !== '') {
    if (!Number.isInteger(Number(department_id)) || Number(department_id) <= 0) {
      errors.push('department_id must be a positive integer if provided');
    }
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
  validateCalculatePayroll,
  validateSimulatePayroll,
  validateBatchPayroll
};
