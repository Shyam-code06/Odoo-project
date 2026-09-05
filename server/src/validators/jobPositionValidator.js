/**
 * Job Position Request Validators
 */

export const validateJobPositionCreate = (req, res, next) => {
  const { title, code, department_id, description } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Job position title is required' });
  } else if (title.trim().length < 2 || title.trim().length > 150) {
    errors.push({ field: 'title', message: 'Job position title must be between 2 and 150 characters' });
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push({ field: 'code', message: 'Job position code is required' });
  } else if (code.trim().length < 2 || code.trim().length > 50) {
    errors.push({ field: 'code', message: 'Job position code must be between 2 and 50 characters' });
  }

  if (department_id === undefined || department_id === null || department_id === '') {
    errors.push({ field: 'department_id', message: 'Department ID is required' });
  } else {
    const num = Number(department_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'department_id', message: 'Department ID must be a positive integer' });
    }
  }

  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a text string' });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  req.body.title = title.trim();
  req.body.code = code.trim().toUpperCase();
  req.body.department_id = Number(department_id);
  if (description !== undefined && description !== null) {
    req.body.description = description.trim();
  }

  next();
};

export const validateJobPositionUpdate = (req, res, next) => {
  const { title, code, department_id, description } = req.body;
  const errors = [];

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push({ field: 'title', message: 'Job position title cannot be empty' });
    } else if (title.trim().length < 2 || title.trim().length > 150) {
      errors.push({ field: 'title', message: 'Job position title must be between 2 and 150 characters' });
    } else {
      req.body.title = title.trim();
    }
  }

  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Job position code cannot be empty' });
    } else if (code.trim().length < 2 || code.trim().length > 50) {
      errors.push({ field: 'code', message: 'Job position code must be between 2 and 50 characters' });
    } else {
      req.body.code = code.trim().toUpperCase();
    }
  }

  if (department_id !== undefined && department_id !== null) {
    const num = Number(department_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'department_id', message: 'Department ID must be a positive integer' });
    } else {
      req.body.department_id = num;
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a text string' });
    } else {
      req.body.description = description.trim();
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
  validateJobPositionCreate,
  validateJobPositionUpdate
};
