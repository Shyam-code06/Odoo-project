const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

/**
 * Helper to convert HH:mm or HH:mm:ss to total minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const match = timeStr.match(TIME_REGEX);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
};

/**
 * Validate single day schedule object
 */
const validateDayObject = (day, index = null) => {
  const prefix = index !== null ? `Day at index ${index}: ` : '';
  const errors = [];

  if (!day.day_of_week || !VALID_DAYS.includes(day.day_of_week)) {
    errors.push(`${prefix}day_of_week must be one of [${VALID_DAYS.join(', ')}]`);
  }

  const startMin = timeToMinutes(day.start_time);
  if (startMin === null) {
    errors.push(`${prefix}start_time must be a valid time format (HH:mm or HH:mm:ss)`);
  }

  const endMin = timeToMinutes(day.end_time);
  if (endMin === null) {
    errors.push(`${prefix}end_time must be a valid time format (HH:mm or HH:mm:ss)`);
  }

  if (startMin !== null && endMin !== null) {
    if (endMin <= startMin) {
      errors.push(`${prefix}end_time must be strictly after start_time`);
    }

    const breakMin = day.break_minutes !== undefined && day.break_minutes !== null
      ? parseInt(day.break_minutes, 10)
      : 0;

    if (isNaN(breakMin) || breakMin < 0) {
      errors.push(`${prefix}break_minutes must be a non-negative integer`);
    } else if (breakMin >= endMin - startMin) {
      errors.push(`${prefix}break_minutes must be strictly less than the total shift duration (${endMin - startMin} mins)`);
    }
  }

  return errors;
};

/**
 * Middleware: Validate Schedule Creation
 */
export const validateScheduleCreate = (req, res, next) => {
  const { name, timezone, is_active, days } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('name is required and must be between 2 and 100 characters');
  }

  if (timezone !== undefined && timezone !== null && (typeof timezone !== 'string' || timezone.trim().length === 0)) {
    errors.push('timezone must be a non-empty string (e.g. UTC, Asia/Kolkata)');
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  if (days !== undefined) {
    if (!Array.isArray(days)) {
      errors.push('days must be an array of schedule day objects');
    } else {
      const seenDays = new Set();
      days.forEach((day, index) => {
        if (!day || typeof day !== 'object') {
          errors.push(`Day at index ${index} must be an object`);
          return;
        }

        const dayErrors = validateDayObject(day, index);
        errors.push(...dayErrors);

        if (day.day_of_week) {
          if (seenDays.has(day.day_of_week)) {
            errors.push(`Duplicate day '${day.day_of_week}' detected at index ${index}`);
          }
          seenDays.add(day.day_of_week);
        }
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

  next();
};

/**
 * Middleware: Validate Schedule Update
 */
export const validateScheduleUpdate = (req, res, next) => {
  const { name, timezone, is_active, days } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      errors.push('name must be between 2 and 100 characters');
    }
  }

  if (timezone !== undefined && timezone !== null && (typeof timezone !== 'string' || timezone.trim().length === 0)) {
    errors.push('timezone must be a non-empty string');
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push('is_active must be a boolean');
  }

  if (days !== undefined) {
    if (!Array.isArray(days)) {
      errors.push('days must be an array of schedule day objects');
    } else {
      const seenDays = new Set();
      days.forEach((day, index) => {
        if (!day || typeof day !== 'object') {
          errors.push(`Day at index ${index} must be an object`);
          return;
        }

        const dayErrors = validateDayObject(day, index);
        errors.push(...dayErrors);

        if (day.day_of_week) {
          if (seenDays.has(day.day_of_week)) {
            errors.push(`Duplicate day '${day.day_of_week}' detected at index ${index}`);
          }
          seenDays.add(day.day_of_week);
        }
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

  next();
};

/**
 * Middleware: Validate Schedule Day Creation
 */
export const validateScheduleDayCreate = (req, res, next) => {
  const errors = validateDayObject(req.body);

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
 * Middleware: Validate Schedule Day Update
 */
export const validateScheduleDayUpdate = (req, res, next) => {
  const { day_of_week, start_time, end_time, break_minutes } = req.body;
  const errors = [];

  if (day_of_week !== undefined && !VALID_DAYS.includes(day_of_week)) {
    errors.push(`day_of_week must be one of [${VALID_DAYS.join(', ')}]`);
  }

  if (start_time !== undefined && timeToMinutes(start_time) === null) {
    errors.push('start_time must be a valid time format (HH:mm or HH:mm:ss)');
  }

  if (end_time !== undefined && timeToMinutes(end_time) === null) {
    errors.push('end_time must be a valid time format (HH:mm or HH:mm:ss)');
  }

  if (break_minutes !== undefined) {
    const breakMin = parseInt(break_minutes, 10);
    if (isNaN(breakMin) || breakMin < 0) {
      errors.push('break_minutes must be a non-negative integer');
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
  validateScheduleCreate,
  validateScheduleUpdate,
  validateScheduleDayCreate,
  validateScheduleDayUpdate
};
