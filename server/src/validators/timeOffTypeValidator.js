/**
 * Time Off Type Request Validators
 */

const ALLOWED_UNITS = ['days', 'hours'];

export const validateTimeOffTypeCreate = (req, res, next) => {
  const { name, code, unit, requires_allocation, requires_approval, is_paid, is_active } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Time off type name is required' });
  } else if (name.trim().length < 2 || name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Time off type name must be between 2 and 100 characters' });
  }

  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push({ field: 'code', message: 'Time off type code is required' });
  } else if (code.trim().length < 2 || code.trim().length > 50) {
    errors.push({ field: 'code', message: 'Time off type code must be between 2 and 50 characters' });
  }

  if (!unit || typeof unit !== 'string') {
    errors.push({ field: 'unit', message: 'Unit is required and must be either "days" or "hours"' });
  } else if (!ALLOWED_UNITS.includes(unit.trim().toLowerCase())) {
    errors.push({ field: 'unit', message: 'Unit must be either "days" or "hours"' });
  }

  if (requires_allocation !== undefined && typeof requires_allocation !== 'boolean') {
    errors.push({ field: 'requires_allocation', message: 'requires_allocation must be a boolean value' });
  }

  if (requires_approval !== undefined && typeof requires_approval !== 'boolean') {
    errors.push({ field: 'requires_approval', message: 'requires_approval must be a boolean value' });
  }

  if (is_paid !== undefined && typeof is_paid !== 'boolean') {
    errors.push({ field: 'is_paid', message: 'is_paid must be a boolean value' });
  }

  if (is_active !== undefined && typeof is_active !== 'boolean') {
    errors.push({ field: 'is_active', message: 'is_active must be a boolean value' });
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
  req.body.unit = unit.trim().toLowerCase();
  req.body.requires_allocation = requires_allocation !== undefined ? Boolean(requires_allocation) : true;
  req.body.requires_approval = requires_approval !== undefined ? Boolean(requires_approval) : true;
  req.body.is_paid = is_paid !== undefined ? Boolean(is_paid) : true;
  req.body.is_active = is_active !== undefined ? Boolean(is_active) : true;

  next();
};

export const validateTimeOffTypeUpdate = (req, res, next) => {
  const { name, code, unit, requires_allocation, requires_approval, is_paid, is_active } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Time off type name cannot be empty' });
    } else if (name.trim().length < 2 || name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Time off type name must be between 2 and 100 characters' });
    } else {
      req.body.name = name.trim();
    }
  }

  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Time off type code cannot be empty' });
    } else if (code.trim().length < 2 || code.trim().length > 50) {
      errors.push({ field: 'code', message: 'Time off type code must be between 2 and 50 characters' });
    } else {
      req.body.code = code.trim().toUpperCase();
    }
  }

  if (unit !== undefined) {
    if (typeof unit !== 'string' || !ALLOWED_UNITS.includes(unit.trim().toLowerCase())) {
      errors.push({ field: 'unit', message: 'Unit must be either "days" or "hours"' });
    } else {
      req.body.unit = unit.trim().toLowerCase();
    }
  }

  if (requires_allocation !== undefined) {
    if (typeof requires_allocation !== 'boolean') {
      errors.push({ field: 'requires_allocation', message: 'requires_allocation must be a boolean value' });
    } else {
      req.body.requires_allocation = Boolean(requires_allocation);
    }
  }

  if (requires_approval !== undefined) {
    if (typeof requires_approval !== 'boolean') {
      errors.push({ field: 'requires_approval', message: 'requires_approval must be a boolean value' });
    } else {
      req.body.requires_approval = Boolean(requires_approval);
    }
  }

  if (is_paid !== undefined) {
    if (typeof is_paid !== 'boolean') {
      errors.push({ field: 'is_paid', message: 'is_paid must be a boolean value' });
    } else {
      req.body.is_paid = Boolean(is_paid);
    }
  }

  if (is_active !== undefined) {
    if (typeof is_active !== 'boolean') {
      errors.push({ field: 'is_active', message: 'is_active must be a boolean value' });
    } else {
      req.body.is_active = Boolean(is_active);
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

export const validateTimeOffTypeStatus = (req, res, next) => {
  const { is_active } = req.body;

  if (is_active === undefined || typeof is_active !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [
        { field: 'is_active', message: 'is_active is required and must be a boolean value (true or false)' }
      ]
    });
  }

  req.body.is_active = Boolean(is_active);
  next();
};

export default {
  validateTimeOffTypeCreate,
  validateTimeOffTypeUpdate,
  validateTimeOffTypeStatus
};
