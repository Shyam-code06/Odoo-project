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
 * Middleware: Validate Step 1 - Query Eligible Employees
 */
export const validateEligibleEmployees = (req, res, next) => {
  const {
    period_start,
    period_end,
    salary_structure_id,
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

  // Salary Structure ID (optional in preview, but if provided must be integer)
  if (salary_structure_id !== undefined && salary_structure_id !== null && salary_structure_id !== '') {
    if (!Number.isInteger(Number(salary_structure_id)) || Number(salary_structure_id) <= 0) {
      errors.push('salary_structure_id must be a positive integer if provided');
    }
  }

  // Department ID (optional)
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

/**
 * Middleware: Validate Step 2 - Create Payrun
 */
export const validatePayrunCreate = (req, res, next) => {
  const {
    name,
    salary_structure_id,
    period_start,
    period_end,
    employee_ids
  } = req.body;

  const errors = [];

  // Name
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('name is required and must be a string between 2 and 100 characters');
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

  // Salary Structure ID (optional default structure)
  if (salary_structure_id !== undefined && salary_structure_id !== null && salary_structure_id !== '') {
    if (!Number.isInteger(Number(salary_structure_id)) || Number(salary_structure_id) <= 0) {
      errors.push('salary_structure_id must be a positive integer if provided');
    }
  }

  // Employee IDs
  if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
    errors.push('employee_ids is required and must be a non-empty array of employee IDs');
  } else if (employee_ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
    errors.push('All elements in employee_ids must be positive integers');
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
 * Middleware: Validate Add Employees to Draft Payrun
 */
export const validateAddEmployees = (req, res, next) => {
  const { employee_ids } = req.body;

  const errors = [];

  if (!employee_ids || !Array.isArray(employee_ids) || employee_ids.length === 0) {
    errors.push('employee_ids is required and must be a non-empty array of employee IDs');
  } else if (employee_ids.some(id => !Number.isInteger(Number(id)) || Number(id) <= 0)) {
    errors.push('All elements in employee_ids must be positive integers');
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
  validateEligibleEmployees,
  validatePayrunCreate,
  validateAddEmployees
};
