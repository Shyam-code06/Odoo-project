/**
 * Safe Formula & Expression Evaluator for Payroll Engine
 * 
 * Safely evaluates mathematical and conditional expressions for salary rules
 * without using dangerous native eval() or unrestricted new Function().
 */

const FORBIDDEN_IDENTIFIERS = [
  'process',
  'require',
  'import',
  'global',
  'globalThis',
  'window',
  'document',
  'Function',
  'eval',
  'constructor',
  '__proto__',
  'prototype',
  'module',
  'exports',
  'setTimeout',
  'setInterval',
  'setImmediate'
];

/**
 * Sanitize and validate that expression does not contain hazardous syntax
 * @param {string} expr
 */
export const validateExpressionSafety = (expr) => {
  if (typeof expr !== 'string') return;

  for (const forbidden of FORBIDDEN_IDENTIFIERS) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (regex.test(expr)) {
      const error = new Error(`Security Violation: Forbidden identifier '${forbidden}' found in expression.`);
      error.statusCode = 400;
      error.code = 'UNSAFE_EXPRESSION';
      throw error;
    }
  }

  // Block dangerous characters/patterns
  if (/;|\bwhile\b|\bfor\b|\bdo\b|\bfunction\b|\bclass\b|\bnew\b|\bdelete\b|\btypeof\b|\bvoid\b/i.test(expr)) {
    const error = new Error('Security Violation: Disallowed statement or operator in expression.');
    error.statusCode = 400;
    error.code = 'UNSAFE_EXPRESSION';
    throw error;
  }
};

/**
 * Flatten context object into dot-notation and direct variable map
 * E.g. { contract: { wage: 50000 } } => { 'contract.wage': 50000, 'wage': 50000 }
 */
export const flattenContext = (context = {}) => {
  const flat = {};

  const traverse = (obj, prefix = '') => {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        traverse(value, fullKey);
      } else {
        flat[fullKey] = value;
      }
    }
  };

  traverse(context);

  // Also expose top-level keys directly
  for (const [k, v] of Object.entries(context)) {
    if (typeof v !== 'object') {
      flat[k] = v;
    }
  }

  return flat;
};

/**
 * Safely evaluates a mathematical or logical expression against a context object
 *
 * @param {string} expression - E.g. "contract.wage * 0.50", "BASIC + HRA + SA", "worked_days >= 20"
 * @param {object} context - Variables dictionary available during evaluation
 * @returns {number|boolean} Result of evaluation
 */
export const evaluateFormula = (expression, context = {}) => {
  if (!expression || typeof expression !== 'string' || !expression.trim()) {
    return 0;
  }

  const trimmedExpr = expression.trim();
  validateExpressionSafety(trimmedExpr);

  // Build the execution scope with safe math functions and provided context
  const safeMath = {
    min: Math.min,
    max: Math.max,
    round: Math.round,
    floor: Math.floor,
    ceil: Math.ceil,
    abs: Math.abs,
    pow: Math.pow,
    sqrt: Math.sqrt
  };

  // Build parameter names and values from context
  const flatCtx = flattenContext(context);
  
  // Transform dot-notation in formula like "contract.wage" to valid JS identifier or nested access
  // We can pass context as a single root object `ctx` and also unpack safe variables
  const scopeKeys = [];
  const scopeValues = [];

  // Add safe Math functions
  for (const [fnName, fn] of Object.entries(safeMath)) {
    scopeKeys.push(fnName);
    scopeValues.push(fn);
  }

  // Add Math object itself
  scopeKeys.push('Math');
  scopeValues.push(safeMath);

  // Add all context variables as direct identifiers
  for (const [k, v] of Object.entries(flatCtx)) {
    // Valid JS variable identifier check
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k)) {
      scopeKeys.push(k);
      scopeValues.push(v);
    }
  }

  // Also provide `contract`, `attendance`, `time_off`, `employee` root objects if present
  for (const rootKey of ['contract', 'attendance', 'time_off', 'employee', 'schedule', 'rules']) {
    if (context[rootKey] !== undefined) {
      scopeKeys.push(rootKey);
      scopeValues.push(context[rootKey]);
    }
  }

  try {
    // Create a sandboxed function with explicit arguments
    // "use strict"; prevents global scope leakage
    const evaluator = new Function(...scopeKeys, `"use strict"; return (${trimmedExpr});`);
    const result = evaluator(...scopeValues);

    if (typeof result === 'boolean') {
      return result;
    }

    if (typeof result === 'number') {
      if (isNaN(result) || !isFinite(result)) {
        return 0;
      }
      return Number(result.toFixed(4));
    }

    return result;
  } catch (err) {
    const error = new Error(`Formula evaluation error in '${trimmedExpr}': ${err.message}`);
    error.statusCode = 400;
    error.code = 'FORMULA_EVAL_ERROR';
    throw error;
  }
};

/**
 * Safely evaluates a rule condition expression.
 * Returns true if condition is empty/null or evaluates to truthy.
 *
 * @param {string|null} conditionExpr - E.g. "contract.wage > 30000", "worked_days > 0"
 * @param {object} context - Variables dictionary
 * @returns {boolean}
 */
export const evaluateCondition = (conditionExpr, context = {}) => {
  if (!conditionExpr || typeof conditionExpr !== 'string' || !conditionExpr.trim()) {
    return true; // No condition means always execute
  }

  try {
    const result = evaluateFormula(conditionExpr, context);
    return Boolean(result);
  } catch (err) {
    const error = new Error(`Condition evaluation error in '${conditionExpr}': ${err.message}`);
    error.statusCode = 400;
    error.code = 'CONDITION_EVAL_ERROR';
    throw error;
  }
};

export default {
  evaluateFormula,
  evaluateCondition,
  validateExpressionSafety,
  flattenContext
};
