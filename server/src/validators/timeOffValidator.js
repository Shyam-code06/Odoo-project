/**
 * Time Off & Leave Management Request Validators
 */

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const isValidDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string' || !DATE_REGEX.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === dateStr;
};

/**
 * Validate Time Off Allocation creation payload
 */
export const validateAllocationCreate = (req, res, next) => {
  const { employee_id, time_off_type_id, start_date, end_date, allocated_amount } = req.body;
  const errors = [];

  // employee_id
  if (!employee_id || isNaN(Number(employee_id)) || Number(employee_id) <= 0) {
    errors.push({ field: 'employee_id', message: 'Valid employee ID is required' });
  }

  // time_off_type_id
  if (!time_off_type_id || isNaN(Number(time_off_type_id)) || Number(time_off_type_id) <= 0) {
    errors.push({ field: 'time_off_type_id', message: 'Valid time off type ID is required' });
  }

  // start_date
  if (!start_date || !isValidDate(start_date)) {
    errors.push({ field: 'start_date', message: 'Valid start date is required in YYYY-MM-DD format' });
  }

  // end_date
  if (!end_date || !isValidDate(end_date)) {
    errors.push({ field: 'end_date', message: 'Valid end date is required in YYYY-MM-DD format' });
  }

  // date order
  if (start_date && end_date && isValidDate(start_date) && isValidDate(end_date)) {
    if (new Date(end_date) < new Date(start_date)) {
      errors.push({ field: 'end_date', message: 'End date must be greater than or equal to start date' });
    }
  }

  // allocated_amount
  if (
    allocated_amount === undefined ||
    allocated_amount === null ||
    isNaN(Number(allocated_amount)) ||
    Number(allocated_amount) <= 0
  ) {
    errors.push({ field: 'allocated_amount', message: 'Allocated amount must be a positive number greater than 0' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.employee_id = Number(employee_id);
  req.body.time_off_type_id = Number(time_off_type_id);
  req.body.start_date = start_date.trim();
  req.body.end_date = end_date.trim();
  req.body.allocated_amount = Number(allocated_amount);

  next();
};

/**
 * Validate Leave Request creation payload
 */
export const validateLeaveRequestCreate = (req, res, next) => {
  const { employee_id, time_off_type_id, start_date, end_date, duration, reason } = req.body;
  const errors = [];

  // employee_id (optional in body for employee role since it is taken from req.user.employee_id)
  if (employee_id !== undefined && employee_id !== null) {
    if (isNaN(Number(employee_id)) || Number(employee_id) <= 0) {
      errors.push({ field: 'employee_id', message: 'Employee ID must be a positive integer if provided' });
    }
  }

  // time_off_type_id
  if (!time_off_type_id || isNaN(Number(time_off_type_id)) || Number(time_off_type_id) <= 0) {
    errors.push({ field: 'time_off_type_id', message: 'Valid time off type ID is required' });
  }

  // start_date
  if (!start_date || !isValidDate(start_date)) {
    errors.push({ field: 'start_date', message: 'Valid start date is required in YYYY-MM-DD format' });
  }

  // end_date
  if (!end_date || !isValidDate(end_date)) {
    errors.push({ field: 'end_date', message: 'Valid end date is required in YYYY-MM-DD format' });
  }

  // date order
  if (start_date && end_date && isValidDate(start_date) && isValidDate(end_date)) {
    if (new Date(end_date) < new Date(start_date)) {
      errors.push({ field: 'end_date', message: 'End date must be greater than or equal to start date' });
    }
  }

  // duration
  if (duration === undefined || duration === null || isNaN(Number(duration)) || Number(duration) <= 0) {
    errors.push({ field: 'duration', message: 'Duration must be a positive number greater than 0' });
  }

  // reason
  if (reason !== undefined && reason !== null && typeof reason !== 'string') {
    errors.push({ field: 'reason', message: 'Reason must be a string' });
  } else if (typeof reason === 'string' && reason.length > 1000) {
    errors.push({ field: 'reason', message: 'Reason cannot exceed 1000 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  if (employee_id !== undefined && employee_id !== null) {
    req.body.employee_id = Number(employee_id);
  }
  req.body.time_off_type_id = Number(time_off_type_id);
  req.body.start_date = start_date.trim();
  req.body.end_date = end_date.trim();
  req.body.duration = Number(duration);
  req.body.reason = typeof reason === 'string' ? reason.trim() : null;

  next();
};

/**
 * Validate Leave Request rejection payload
 */
export const validateLeaveRequestReject = (req, res, next) => {
  const { rejected_reason } = req.body;
  const errors = [];

  if (rejected_reason !== undefined && rejected_reason !== null) {
    if (typeof rejected_reason !== 'string') {
      errors.push({ field: 'rejected_reason', message: 'Rejection reason must be a string' });
    } else if (rejected_reason.length > 1000) {
      errors.push({ field: 'rejected_reason', message: 'Rejection reason cannot exceed 1000 characters' });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.rejected_reason = typeof rejected_reason === 'string' ? rejected_reason.trim() : null;
  next();
};
