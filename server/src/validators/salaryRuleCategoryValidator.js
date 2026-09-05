/**
 * Salary Rule Category Request Validators
 */

export const validateSalaryRuleCategoryCreate = (req, res, next) => {
  const { name, code, parent_id, description } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Salary rule category name is required' });
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Category name must be between 2 and 100 characters' });
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push({ field: 'code', message: 'Salary rule category code is required' });
  } else if (code.trim().length < 2 || code.trim().length > 50) {
    errors.push({ field: 'code', message: 'Category code must be between 2 and 50 characters' });
  }

  if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
    const num = Number(parent_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'parent_id', message: 'Parent ID must be a positive integer' });
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

  req.body.name = name.trim();
  req.body.code = code.trim().toUpperCase();
  if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
    req.body.parent_id = Number(parent_id);
  } else {
    req.body.parent_id = null;
  }
  if (description !== undefined && description !== null) {
    req.body.description = description.trim();
  }

  next();
};

export const validateSalaryRuleCategoryUpdate = (req, res, next) => {
  const { name, code, parent_id, description } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Category name cannot be empty' });
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Category name must be between 2 and 100 characters' });
    } else {
      req.body.name = name.trim();
    }
  }

  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Category code cannot be empty' });
    } else if (code.trim().length < 2 || code.trim().length > 50) {
      errors.push({ field: 'code', message: 'Category code must be between 2 and 50 characters' });
    } else {
      req.body.code = code.trim().toUpperCase();
    }
  }

  if (parent_id !== undefined && parent_id !== null && parent_id !== '') {
    const num = Number(parent_id);
    if (!Number.isInteger(num) || num <= 0) {
      errors.push({ field: 'parent_id', message: 'Parent ID must be a positive integer' });
    } else {
      req.body.parent_id = num;
    }
  } else if (parent_id === null || parent_id === '') {
    req.body.parent_id = null;
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
  validateSalaryRuleCategoryCreate,
  validateSalaryRuleCategoryUpdate
};
