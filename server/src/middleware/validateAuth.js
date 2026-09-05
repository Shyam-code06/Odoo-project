/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Middleware to validate Signup payload
 */
export const validateSignup = (req, res, next) => {
  const { email, password, role_id, employee_id } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
  }

  if (role_id !== undefined && role_id !== null && (!Number.isInteger(Number(role_id)) || Number(role_id) <= 0)) {
    errors.push({ field: 'role_id', message: 'Role ID must be a positive integer.' });
  }

  if (employee_id !== undefined && employee_id !== null && (!Number.isInteger(Number(employee_id)) || Number(employee_id) <= 0)) {
    errors.push({ field: 'employee_id', message: 'Employee ID must be a positive integer.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Middleware to validate Login payload
 */
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push({ field: 'email', message: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors
    });
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

export default {
  validateSignup,
  validateLogin
};
