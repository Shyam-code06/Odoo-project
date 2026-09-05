const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'internship'];
const CONTRACT_STATUSES = ['draft', 'active', 'expired', 'terminated', 'cancelled'];
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
 * Middleware: Validate Contract Creation
 */
export const validateContractCreate = (req, res, next) => {
  const {
    employee_id,
    contract_number,
    start_date,
    end_date,
    department_id,
    job_position_id,
    working_schedule_id,
    salary_structure_id,
    wage,
    employment_type,
    status
  } = req.body;

  const errors = [];

  // Employee ID
  if (!employee_id || !Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0) {
    errors.push('employee_id is required and must be a positive integer');
  }

  // Contract Number (optional, auto-generated if omitted)
  if (contract_number !== undefined && contract_number !== null) {
    if (typeof contract_number !== 'string' || contract_number.trim().length < 2 || contract_number.trim().length > 100) {
      errors.push('contract_number must be a string between 2 and 100 characters');
    }
  }

  // Start Date
  if (!start_date || !isValidDate(start_date)) {
    errors.push('start_date is required and must be in YYYY-MM-DD format');
  }

  // End Date
  if (end_date !== undefined && end_date !== null && end_date !== '') {
    if (!isValidDate(end_date)) {
      errors.push('end_date must be in YYYY-MM-DD format');
    } else if (isValidDate(start_date) && new Date(end_date) < new Date(start_date)) {
      errors.push('end_date cannot be earlier than start_date');
    }
  }

  // Foreign keys
  if (department_id !== undefined && department_id !== null && (!Number.isInteger(Number(department_id)) || Number(department_id) <= 0)) {
    errors.push('department_id must be a positive integer');
  }

  if (job_position_id !== undefined && job_position_id !== null && (!Number.isInteger(Number(job_position_id)) || Number(job_position_id) <= 0)) {
    errors.push('job_position_id must be a positive integer');
  }

  if (working_schedule_id !== undefined && working_schedule_id !== null && (!Number.isInteger(Number(working_schedule_id)) || Number(working_schedule_id) <= 0)) {
    errors.push('working_schedule_id must be a positive integer');
  }

  if (salary_structure_id !== undefined && salary_structure_id !== null && (!Number.isInteger(Number(salary_structure_id)) || Number(salary_structure_id) <= 0)) {
    errors.push('salary_structure_id must be a positive integer');
  }

  // Wage
  if (wage === undefined || wage === null || isNaN(Number(wage)) || Number(wage) < 0) {
    errors.push('wage is required and must be a non-negative number');
  }

  // Employment Type
  if (employment_type !== undefined && !EMPLOYMENT_TYPES.includes(employment_type)) {
    errors.push(`employment_type must be one of [${EMPLOYMENT_TYPES.join(', ')}]`);
  }

  // Status
  if (status !== undefined && !CONTRACT_STATUSES.includes(status)) {
    errors.push(`status must be one of [${CONTRACT_STATUSES.join(', ')}]`);
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
 * Middleware: Validate Contract Update
 */
export const validateContractUpdate = (req, res, next) => {
  const {
    employee_id,
    contract_number,
    start_date,
    end_date,
    department_id,
    job_position_id,
    working_schedule_id,
    salary_structure_id,
    wage,
    employment_type,
    status
  } = req.body;

  const errors = [];

  if (employee_id !== undefined && (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0)) {
    errors.push('employee_id must be a positive integer');
  }

  if (contract_number !== undefined) {
    if (typeof contract_number !== 'string' || contract_number.trim().length < 2 || contract_number.trim().length > 100) {
      errors.push('contract_number must be a string between 2 and 100 characters');
    }
  }

  if (start_date !== undefined && !isValidDate(start_date)) {
    errors.push('start_date must be in YYYY-MM-DD format');
  }

  if (end_date !== undefined && end_date !== null && end_date !== '') {
    if (!isValidDate(end_date)) {
      errors.push('end_date must be in YYYY-MM-DD format');
    }
  }

  if (start_date && end_date && isValidDate(start_date) && isValidDate(end_date)) {
    if (new Date(end_date) < new Date(start_date)) {
      errors.push('end_date cannot be earlier than start_date');
    }
  }

  if (department_id !== undefined && department_id !== null && (!Number.isInteger(Number(department_id)) || Number(department_id) <= 0)) {
    errors.push('department_id must be a positive integer');
  }

  if (job_position_id !== undefined && job_position_id !== null && (!Number.isInteger(Number(job_position_id)) || Number(job_position_id) <= 0)) {
    errors.push('job_position_id must be a positive integer');
  }

  if (working_schedule_id !== undefined && working_schedule_id !== null && (!Number.isInteger(Number(working_schedule_id)) || Number(working_schedule_id) <= 0)) {
    errors.push('working_schedule_id must be a positive integer');
  }

  if (salary_structure_id !== undefined && salary_structure_id !== null && (!Number.isInteger(Number(salary_structure_id)) || Number(salary_structure_id) <= 0)) {
    errors.push('salary_structure_id must be a positive integer');
  }

  if (wage !== undefined && (isNaN(Number(wage)) || Number(wage) < 0)) {
    errors.push('wage must be a non-negative number');
  }

  if (employment_type !== undefined && !EMPLOYMENT_TYPES.includes(employment_type)) {
    errors.push(`employment_type must be one of [${EMPLOYMENT_TYPES.join(', ')}]`);
  }

  if (status !== undefined && !CONTRACT_STATUSES.includes(status)) {
    errors.push(`status must be one of [${CONTRACT_STATUSES.join(', ')}]`);
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
 * Middleware: Validate Contract Status Patch
 */
export const validateContractStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || !CONTRACT_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status is required and must be one of [${CONTRACT_STATUSES.join(', ')}]`
    });
  }
  next();
};

export default {
  validateContractCreate,
  validateContractUpdate,
  validateContractStatus
};
