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
 * Middleware: Validate Dashboard & Report Filter Query Parameters
 */
export const validateReportFilters = (req, res, next) => {
  const {
    date_from,
    date_to,
    department_id,
    employee_id,
    status
  } = req.query;

  const errors = [];

  if (date_from && !isValidDate(date_from)) {
    errors.push('date_from must be in YYYY-MM-DD format');
  }

  if (date_to && !isValidDate(date_to)) {
    errors.push('date_to must be in YYYY-MM-DD format');
  } else if (date_from && date_to && isValidDate(date_from) && isValidDate(date_to)) {
    if (new Date(date_to) < new Date(date_from)) {
      errors.push('date_to cannot be earlier than date_from');
    }
  }

  if (department_id !== undefined && department_id !== '' && (!Number.isInteger(Number(department_id)) || Number(department_id) <= 0)) {
    errors.push('department_id must be a positive integer');
  }

  if (employee_id !== undefined && employee_id !== '' && (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0)) {
    errors.push('employee_id must be a positive integer');
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
  validateReportFilters
};
