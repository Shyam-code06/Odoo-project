/**
 * Department Request Validators
 */

export const validateDepartmentCreate = (req, res, next) => {
  const { name, code, description, manager_id } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Department name is required' });
  } else if (name.trim().length < 2 || name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Department name must be between 2 and 150 characters' });
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push({ field: 'code', message: 'Department code is required' });
  } else if (code.trim().length < 2 || code.trim().length > 50) {
    errors.push({ field: 'code', message: 'Department code must be between 2 and 50 characters' });
  }

  if (manager_id !== undefined && manager_id !== null && manager_id !== '') {
    const num = Number(manager_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'manager_id', message: 'Manager ID must be a positive integer' });
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

  // Normalize trimmed values
  req.body.name = name.trim();
  req.body.code = code.trim().toUpperCase();
  if (manager_id !== undefined && manager_id !== null && manager_id !== '') {
    req.body.manager_id = Number(manager_id);
  } else {
    req.body.manager_id = null;
  }
  if (description !== undefined && description !== null) {
    req.body.description = description.trim();
  }

  next();
};

export const validateDepartmentUpdate = (req, res, next) => {
  const { name, code, description, manager_id } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Department name cannot be empty' });
    } else if (name.trim().length < 2 || name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Department name must be between 2 and 150 characters' });
    } else {
      req.body.name = name.trim();
    }
  }

  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Department code cannot be empty' });
    } else if (code.trim().length < 2 || code.trim().length > 50) {
      errors.push({ field: 'code', message: 'Department code must be between 2 and 50 characters' });
    } else {
      req.body.code = code.trim().toUpperCase();
    }
  }

  if (manager_id !== undefined && manager_id !== null && manager_id !== '') {
    const num = Number(manager_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'manager_id', message: 'Manager ID must be a positive integer' });
    } else {
      req.body.manager_id = num;
    }
  } else if (manager_id === null || manager_id === '') {
    req.body.manager_id = null;
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
  validateDepartmentCreate,
  validateDepartmentUpdate
};
