/**
 * Employee Request Validators
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_STATUSES = ['active', 'inactive', 'terminated', 'on_leave'];

export const validateEmployeeCreate = (req, res, next) => {
  const {
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    department_id,
    job_position_id,
    manager_id,
    joining_date,
    employment_status,
    working_schedule_id
  } = req.body;

  const errors = [];

  // Required Fields
  if (!employee_code || typeof employee_code !== 'string' || employee_code.trim().length === 0) {
    errors.push({ field: 'employee_code', message: 'Employee code is required' });
  } else if (employee_code.trim().length < 2 || employee_code.trim().length > 50) {
    errors.push({ field: 'employee_code', message: 'Employee code must be between 2 and 50 characters' });
  }

  if (!first_name || typeof first_name !== 'string' || first_name.trim().length === 0) {
    errors.push({ field: 'first_name', message: 'First name is required' });
  } else if (first_name.trim().length < 2 || first_name.trim().length > 100) {
    errors.push({ field: 'first_name', message: 'First name must be between 2 and 100 characters' });
  }

  if (!last_name || typeof last_name !== 'string' || last_name.trim().length === 0) {
    errors.push({ field: 'last_name', message: 'Last name is required' });
  } else if (last_name.trim().length < 2 || last_name.trim().length > 100) {
    errors.push({ field: 'last_name', message: 'Last name must be between 2 and 100 characters' });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required' });
  }

  if (!joining_date || typeof joining_date !== 'string' || !DATE_REGEX.test(joining_date.trim())) {
    errors.push({ field: 'joining_date', message: 'A valid joining date is required (format: YYYY-MM-DD)' });
  }

  // Optional Fields
  if (date_of_birth !== undefined && date_of_birth !== null && date_of_birth !== '') {
    if (typeof date_of_birth !== 'string' || !DATE_REGEX.test(date_of_birth.trim())) {
      errors.push({ field: 'date_of_birth', message: 'Date of birth must be in YYYY-MM-DD format' });
    }
  }

  if (department_id !== undefined && department_id !== null && department_id !== '') {
    const num = Number(department_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'department_id', message: 'Department ID must be a positive integer' });
    }
  }

  if (job_position_id !== undefined && job_position_id !== null && job_position_id !== '') {
    const num = Number(job_position_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'job_position_id', message: 'Job position ID must be a positive integer' });
    }
  }

  if (manager_id !== undefined && manager_id !== null && manager_id !== '') {
    const num = Number(manager_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'manager_id', message: 'Manager ID must be a positive integer' });
    }
  }

  if (working_schedule_id !== undefined && working_schedule_id !== null && working_schedule_id !== '') {
    const num = Number(working_schedule_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'working_schedule_id', message: 'Working schedule ID must be a positive integer' });
    }
  }

  if (employment_status !== undefined && employment_status !== null && employment_status !== '') {
    if (typeof employment_status !== 'string' || !ALLOWED_STATUSES.includes(employment_status.trim().toLowerCase())) {
      errors.push({
        field: 'employment_status',
        message: `Employment status must be one of: [${ALLOWED_STATUSES.join(', ')}]`
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Normalize request payload
  req.body.employee_code = employee_code.trim().toUpperCase();
  req.body.first_name = first_name.trim();
  req.body.last_name = last_name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.joining_date = joining_date.trim();
  req.body.phone = phone ? phone.trim() : null;
  req.body.date_of_birth = date_of_birth && date_of_birth.trim() ? date_of_birth.trim() : null;
  req.body.address = address && address.trim() ? address.trim() : null;
  req.body.department_id = department_id ? Number(department_id) : null;
  req.body.job_position_id = job_position_id ? Number(job_position_id) : null;
  req.body.manager_id = manager_id ? Number(manager_id) : null;
  req.body.working_schedule_id = working_schedule_id ? Number(working_schedule_id) : null;
  req.body.employment_status = employment_status ? employment_status.trim().toLowerCase() : 'active';

  next();
};

export const validateEmployeeUpdate = (req, res, next) => {
  const {
    employee_code,
    first_name,
    last_name,
    email,
    phone,
    date_of_birth,
    address,
    department_id,
    job_position_id,
    manager_id,
    joining_date,
    employment_status,
    working_schedule_id
  } = req.body;

  const errors = [];
  const targetId = Number(req.params.id);

  if (employee_code !== undefined) {
    if (typeof employee_code !== 'string' || employee_code.trim().length === 0) {
      errors.push({ field: 'employee_code', message: 'Employee code cannot be empty' });
    } else if (employee_code.trim().length < 2 || employee_code.trim().length > 50) {
      errors.push({ field: 'employee_code', message: 'Employee code must be between 2 and 50 characters' });
    } else {
      req.body.employee_code = employee_code.trim().toUpperCase();
    }
  }

  if (first_name !== undefined) {
    if (typeof first_name !== 'string' || first_name.trim().length === 0) {
      errors.push({ field: 'first_name', message: 'First name cannot be empty' });
    } else if (first_name.trim().length < 2 || first_name.trim().length > 100) {
      errors.push({ field: 'first_name', message: 'First name must be between 2 and 100 characters' });
    } else {
      req.body.first_name = first_name.trim();
    }
  }

  if (last_name !== undefined) {
    if (typeof last_name !== 'string' || last_name.trim().length === 0) {
      errors.push({ field: 'last_name', message: 'Last name cannot be empty' });
    } else if (last_name.trim().length < 2 || last_name.trim().length > 100) {
      errors.push({ field: 'last_name', message: 'Last name must be between 2 and 100 characters' });
    } else {
      req.body.last_name = last_name.trim();
    }
  }

  if (email !== undefined) {
    if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      errors.push({ field: 'email', message: 'A valid email address is required' });
    } else {
      req.body.email = email.trim().toLowerCase();
    }
  }

  if (joining_date !== undefined) {
    if (typeof joining_date !== 'string' || !DATE_REGEX.test(joining_date.trim())) {
      errors.push({ field: 'joining_date', message: 'Joining date must be in YYYY-MM-DD format' });
    } else {
      req.body.joining_date = joining_date.trim();
    }
  }

  if (date_of_birth !== undefined && date_of_birth !== null && date_of_birth !== '') {
    if (typeof date_of_birth !== 'string' || !DATE_REGEX.test(date_of_birth.trim())) {
      errors.push({ field: 'date_of_birth', message: 'Date of birth must be in YYYY-MM-DD format' });
    } else {
      req.body.date_of_birth = date_of_birth.trim();
    }
  } else if (date_of_birth === null || date_of_birth === '') {
    req.body.date_of_birth = null;
  }

  if (phone !== undefined) {
    req.body.phone = phone && phone.trim() ? phone.trim() : null;
  }

  if (address !== undefined) {
    req.body.address = address && address.trim() ? address.trim() : null;
  }

  if (department_id !== undefined && department_id !== null && department_id !== '') {
    const num = Number(department_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'department_id', message: 'Department ID must be a positive integer' });
    } else {
      req.body.department_id = num;
    }
  } else if (department_id === null || department_id === '') {
    req.body.department_id = null;
  }

  if (job_position_id !== undefined && job_position_id !== null && job_position_id !== '') {
    const num = Number(job_position_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'job_position_id', message: 'Job position ID must be a positive integer' });
    } else {
      req.body.job_position_id = num;
    }
  } else if (job_position_id === null || job_position_id === '') {
    req.body.job_position_id = null;
  }

  if (manager_id !== undefined && manager_id !== null && manager_id !== '') {
    const num = Number(manager_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'manager_id', message: 'Manager ID must be a positive integer' });
    } else if (num === targetId) {
      errors.push({ field: 'manager_id', message: 'An employee cannot be their own manager' });
    } else {
      req.body.manager_id = num;
    }
  } else if (manager_id === null || manager_id === '') {
    req.body.manager_id = null;
  }

  if (working_schedule_id !== undefined && working_schedule_id !== null && working_schedule_id !== '') {
    const num = Number(working_schedule_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'working_schedule_id', message: 'Working schedule ID must be a positive integer' });
    } else {
      req.body.working_schedule_id = num;
    }
  } else if (working_schedule_id === null || working_schedule_id === '') {
    req.body.working_schedule_id = null;
  }

  if (employment_status !== undefined) {
    if (typeof employment_status !== 'string' || !ALLOWED_STATUSES.includes(employment_status.trim().toLowerCase())) {
      errors.push({
        field: 'employment_status',
        message: `Employment status must be one of: [${ALLOWED_STATUSES.join(', ')}]`
      });
    } else {
      req.body.employment_status = employment_status.trim().toLowerCase();
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

export const validateEmployeeStatus = (req, res, next) => {
  const { employment_status } = req.body;

  if (
    !employment_status ||
    typeof employment_status !== 'string' ||
    !ALLOWED_STATUSES.includes(employment_status.trim().toLowerCase())
  ) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        {
          field: 'employment_status',
          message: `employment_status is required and must be one of: [${ALLOWED_STATUSES.join(', ')}]`
        }
      ]
    });
  }

  req.body.employment_status = employment_status.trim().toLowerCase();
  next();
};

export default {
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateEmployeeStatus
};
