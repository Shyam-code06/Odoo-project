/**
 * Salary Configuration Validators (Salary Structures & Salary Rules)
 */

const ALLOWED_CALCULATION_TYPES = ['fixed', 'percentage', 'formula'];

/**
 * Validate Salary Structure creation payload
 */
export const validateSalaryStructureCreate = (req, res, next) => {
  const { name, code, description, is_active } = req.body;
  const errors = [];

  // name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Salary structure name is required' });
  } else if (name.trim().length < 2 || name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Salary structure name must be between 2 and 150 characters' });
  }

  // code
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push({ field: 'code', message: 'Salary structure code is required' });
  } else if (code.trim().length < 2 || code.trim().length > 50) {
    errors.push({ field: 'code', message: 'Salary structure code must be between 2 and 50 characters' });
  }

  // description
  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' });
  } else if (typeof description === 'string' && description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters' });
  }

  // is_active
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
  req.body.description = typeof description === 'string' ? description.trim() : null;
  req.body.is_active = is_active !== undefined ? Boolean(is_active) : true;

  next();
};

/**
 * Validate Salary Structure update payload
 */
export const validateSalaryStructureUpdate = (req, res, next) => {
  const { name, code, description, is_active } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Salary structure name cannot be empty' });
    } else if (name.trim().length < 2 || name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Salary structure name must be between 2 and 150 characters' });
    }
  }

  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Salary structure code cannot be empty' });
    } else if (code.trim().length < 2 || code.trim().length > 50) {
      errors.push({ field: 'code', message: 'Salary structure code must be between 2 and 50 characters' });
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({ field: 'description', message: 'Description must be a string' });
    } else if (description.length > 1000) {
      errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters' });
    }
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

  if (name !== undefined) req.body.name = name.trim();
  if (code !== undefined) req.body.code = code.trim().toUpperCase();
  if (description !== undefined) req.body.description = typeof description === 'string' ? description.trim() : null;
  if (is_active !== undefined) req.body.is_active = Boolean(is_active);

  next();
};

/**
 * Validate Salary Rule creation payload
 */
export const validateSalaryRuleCreate = (req, res, next) => {
  // If attached via sub-route /api/salary-structures/:id/rules, structure ID can come from params
  const structureId = req.params.structureId || req.params.id || req.body.salary_structure_id;
  const {
    category_id,
    name,
    code,
    sequence,
    calculation_type,
    value,
    condition_expression,
    formula_expression,
    is_active
  } = req.body;

  const errors = [];

  // salary_structure_id
  if (!structureId || isNaN(Number(structureId)) || Number(structureId) <= 0) {
    errors.push({ field: 'salary_structure_id', message: 'Valid salary structure ID is required' });
  }

  // category_id
  if (!category_id || isNaN(Number(category_id)) || Number(category_id) <= 0) {
    errors.push({ field: 'category_id', message: 'Valid category ID is required' });
  }

  // name
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Salary rule name is required' });
  } else if (name.trim().length < 2 || name.trim().length > 150) {
    errors.push({ field: 'name', message: 'Salary rule name must be between 2 and 150 characters' });
  }

  // code
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    errors.push({ field: 'code', message: 'Salary rule code is required' });
  } else if (code.trim().length < 2 || code.trim().length > 50) {
    errors.push({ field: 'code', message: 'Salary rule code must be between 2 and 50 characters' });
  }

  // sequence
  if (sequence !== undefined && sequence !== null) {
    if (isNaN(Number(sequence)) || !Number.isInteger(Number(sequence)) || Number(sequence) < 0) {
      errors.push({ field: 'sequence', message: 'Sequence must be a non-negative integer' });
    }
  }

  // calculation_type
  if (!calculation_type || typeof calculation_type !== 'string') {
    errors.push({
      field: 'calculation_type',
      message: `Calculation type is required and must be one of: ${ALLOWED_CALCULATION_TYPES.join(', ')}`
    });
  } else if (!ALLOWED_CALCULATION_TYPES.includes(calculation_type.trim().toLowerCase())) {
    errors.push({
      field: 'calculation_type',
      message: `Calculation type must be one of: ${ALLOWED_CALCULATION_TYPES.join(', ')}`
    });
  }

  const normalizedCalcType = calculation_type ? calculation_type.trim().toLowerCase() : null;

  // value validation based on calculation_type
  if (normalizedCalcType === 'fixed' || normalizedCalcType === 'percentage') {
    if (value === undefined || value === null || isNaN(Number(value))) {
      errors.push({ field: 'value', message: `Value is required as a valid number for calculation type '${normalizedCalcType}'` });
    } else if (Number(value) < 0) {
      errors.push({ field: 'value', message: 'Value cannot be negative' });
    }
  }

  // formula_expression validation
  if (normalizedCalcType === 'formula') {
    if (!formula_expression || typeof formula_expression !== 'string' || formula_expression.trim().length === 0) {
      errors.push({ field: 'formula_expression', message: "Formula expression is required when calculation type is 'formula'" });
    }
  }

  // condition_expression
  if (condition_expression !== undefined && condition_expression !== null && typeof condition_expression !== 'string') {
    errors.push({ field: 'condition_expression', message: 'Condition expression must be a string' });
  }

  // is_active
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

  req.body.salary_structure_id = Number(structureId);
  req.body.category_id = Number(category_id);
  req.body.name = name.trim();
  req.body.code = code.trim().toUpperCase();
  req.body.sequence = sequence !== undefined && sequence !== null ? Number(sequence) : 1;
  req.body.calculation_type = normalizedCalcType;
  req.body.value = value !== undefined && value !== null ? Number(value) : 0.0;
  req.body.formula_expression = typeof formula_expression === 'string' ? formula_expression.trim() : null;
  req.body.condition_expression = typeof condition_expression === 'string' ? condition_expression.trim() : null;
  req.body.is_active = is_active !== undefined ? Boolean(is_active) : true;

  next();
};

/**
 * Validate Salary Rule update payload
 */
export const validateSalaryRuleUpdate = (req, res, next) => {
  const {
    salary_structure_id,
    category_id,
    name,
    code,
    sequence,
    calculation_type,
    value,
    condition_expression,
    formula_expression,
    is_active
  } = req.body;

  const errors = [];

  if (salary_structure_id !== undefined) {
    if (isNaN(Number(salary_structure_id)) || Number(salary_structure_id) <= 0) {
      errors.push({ field: 'salary_structure_id', message: 'Valid salary structure ID is required' });
    }
  }

  if (category_id !== undefined) {
    if (isNaN(Number(category_id)) || Number(category_id) <= 0) {
      errors.push({ field: 'category_id', message: 'Valid category ID is required' });
    }
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Salary rule name cannot be empty' });
    } else if (name.trim().length < 2 || name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Salary rule name must be between 2 and 150 characters' });
    }
  }

  if (code !== undefined) {
    if (typeof code !== 'string' || code.trim().length === 0) {
      errors.push({ field: 'code', message: 'Salary rule code cannot be empty' });
    } else if (code.trim().length < 2 || code.trim().length > 50) {
      errors.push({ field: 'code', message: 'Salary rule code must be between 2 and 50 characters' });
    }
  }

  if (sequence !== undefined && sequence !== null) {
    if (isNaN(Number(sequence)) || !Number.isInteger(Number(sequence)) || Number(sequence) < 0) {
      errors.push({ field: 'sequence', message: 'Sequence must be a non-negative integer' });
    }
  }

  if (calculation_type !== undefined) {
    if (typeof calculation_type !== 'string' || !ALLOWED_CALCULATION_TYPES.includes(calculation_type.trim().toLowerCase())) {
      errors.push({
        field: 'calculation_type',
        message: `Calculation type must be one of: ${ALLOWED_CALCULATION_TYPES.join(', ')}`
      });
    }
  }

  if (value !== undefined && value !== null) {
    if (isNaN(Number(value))) {
      errors.push({ field: 'value', message: 'Value must be a valid number' });
    } else if (Number(value) < 0) {
      errors.push({ field: 'value', message: 'Value cannot be negative' });
    }
  }

  if (calculation_type === 'formula' && formula_expression !== undefined) {
    if (typeof formula_expression !== 'string' || formula_expression.trim().length === 0) {
      errors.push({ field: 'formula_expression', message: "Formula expression cannot be empty when calculation type is 'formula'" });
    }
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

  if (salary_structure_id !== undefined) req.body.salary_structure_id = Number(salary_structure_id);
  if (category_id !== undefined) req.body.category_id = Number(category_id);
  if (name !== undefined) req.body.name = name.trim();
  if (code !== undefined) req.body.code = code.trim().toUpperCase();
  if (sequence !== undefined && sequence !== null) req.body.sequence = Number(sequence);
  if (calculation_type !== undefined) req.body.calculation_type = calculation_type.trim().toLowerCase();
  if (value !== undefined && value !== null) req.body.value = Number(value);
  if (formula_expression !== undefined) req.body.formula_expression = typeof formula_expression === 'string' ? formula_expression.trim() : null;
  if (condition_expression !== undefined) req.body.condition_expression = typeof condition_expression === 'string' ? condition_expression.trim() : null;
  if (is_active !== undefined) req.body.is_active = Boolean(is_active);

  next();
};
