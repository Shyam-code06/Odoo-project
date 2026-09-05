const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'half_day', 'on_leave'];
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
 * Validate ISO or valid datetime string
 */
const isValidDateTime = (dateTimeStr) => {
  if (!dateTimeStr || (typeof dateTimeStr !== 'string' && !(dateTimeStr instanceof Date))) return false;
  const d = new Date(dateTimeStr);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Validate latitude and longitude values
 */
const isValidCoordinate = (lat, lon) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  if (isNaN(latitude) || latitude < -90 || latitude > 90) return false;
  if (isNaN(longitude) || longitude < -180 || longitude > 180) return false;
  return true;
};

/**
 * Middleware: Validate Check-In Request (Requires GPS Geolocation)
 */
export const validateCheckIn = (req, res, next) => {
  const { employee_id, check_in, attendance_date, latitude, longitude } = req.body;
  const errors = [];

  // GPS verification
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    errors.push('latitude and longitude GPS coordinates are required for on-site check-in verification');
  } else if (!isValidCoordinate(latitude, longitude)) {
    errors.push('Invalid GPS coordinates: latitude must be between -90 and 90, longitude between -180 and 180');
  }

  if (employee_id !== undefined && (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0)) {
    errors.push('employee_id must be a positive integer');
  }

  if (attendance_date !== undefined && !isValidDate(attendance_date)) {
    errors.push('attendance_date must be in YYYY-MM-DD format');
  }

  if (check_in !== undefined && !isValidDateTime(check_in)) {
    errors.push('check_in must be a valid datetime string');
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
 * Middleware: Validate Check-Out Request (Requires GPS Geolocation)
 */
export const validateCheckOut = (req, res, next) => {
  const { employee_id, check_out, attendance_date, latitude, longitude } = req.body;
  const errors = [];

  // GPS verification
  if (latitude === undefined || latitude === null || longitude === undefined || longitude === null) {
    errors.push('latitude and longitude GPS coordinates are required for on-site check-out verification');
  } else if (!isValidCoordinate(latitude, longitude)) {
    errors.push('Invalid GPS coordinates: latitude must be between -90 and 90, longitude between -180 and 180');
  }

  if (employee_id !== undefined && (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0)) {
    errors.push('employee_id must be a positive integer');
  }

  if (attendance_date !== undefined && !isValidDate(attendance_date)) {
    errors.push('attendance_date must be in YYYY-MM-DD format');
  }

  if (check_out !== undefined && !isValidDateTime(check_out)) {
    errors.push('check_out must be a valid datetime string');
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
 * Middleware: Validate Attendance Manual Correction (HR)
 */
export const validateAttendanceCorrection = (req, res, next) => {
  const { check_in, check_out, attendance_date, status, correction_reason } = req.body;
  const errors = [];

  if (!correction_reason || typeof correction_reason !== 'string' || correction_reason.trim().length < 3) {
    errors.push('correction_reason is required and must be at least 3 characters explaining the modification');
  }

  if (attendance_date !== undefined && !isValidDate(attendance_date)) {
    errors.push('attendance_date must be in YYYY-MM-DD format');
  }

  if (check_in !== undefined && check_in !== null && !isValidDateTime(check_in)) {
    errors.push('check_in must be a valid datetime string or null');
  }

  if (check_out !== undefined && check_out !== null && !isValidDateTime(check_out)) {
    errors.push('check_out must be a valid datetime string or null');
  }

  if (check_in && check_out && isValidDateTime(check_in) && isValidDateTime(check_out)) {
    if (new Date(check_out) <= new Date(check_in)) {
      errors.push('check_out datetime must be strictly after check_in datetime');
    }
  }

  if (status !== undefined && !ATTENDANCE_STATUSES.includes(status.toLowerCase())) {
    errors.push(`status must be one of [${ATTENDANCE_STATUSES.join(', ')}]`);
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
 * Middleware: Validate Manual Attendance Creation (HR)
 */
export const validateManualAttendanceCreate = (req, res, next) => {
  const { employee_id, attendance_date, check_in, check_out, status, correction_reason, latitude, longitude } = req.body;
  const errors = [];

  if (!employee_id || !Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0) {
    errors.push('employee_id is required and must be a positive integer');
  }

  if (!attendance_date || !isValidDate(attendance_date)) {
    errors.push('attendance_date is required and must be in YYYY-MM-DD format');
  }

  if (check_in !== undefined && check_in !== null && !isValidDateTime(check_in)) {
    errors.push('check_in must be a valid datetime string');
  }

  if (check_out !== undefined && check_out !== null && !isValidDateTime(check_out)) {
    errors.push('check_out must be a valid datetime string');
  }

  if (check_in && check_out && isValidDateTime(check_in) && isValidDateTime(check_out)) {
    if (new Date(check_out) <= new Date(check_in)) {
      errors.push('check_out datetime must be strictly after check_in datetime');
    }
  }

  if (latitude !== undefined && longitude !== undefined && !isValidCoordinate(latitude, longitude)) {
    errors.push('Invalid GPS coordinates provided');
  }

  if (status !== undefined && !ATTENDANCE_STATUSES.includes(status.toLowerCase())) {
    errors.push(`status must be one of [${ATTENDANCE_STATUSES.join(', ')}]`);
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
  validateCheckIn,
  validateCheckOut,
  validateAttendanceCorrection,
  validateManualAttendanceCreate
};
