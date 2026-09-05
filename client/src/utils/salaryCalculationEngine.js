/**
 * Safe Salary Calculation Engine
 * Pure domain calculation engine for Salary Rules & Structures without unsafe eval().
 */

/**
 * Safe arithmetic expression evaluator using Tokenizer & Shunting-yard algorithm
 * @param {string} expression 
 * @param {Record<string, number>} context 
 * @returns {number}
 */
export const evaluateFormula = (expression, context = {}) => {
  if (!expression || !expression.trim()) return 0;

  // Replace variable tokens with context values or 0
  const normalized = expression.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (match) => {
    const uppercaseToken = match.toUpperCase();
    if (Object.prototype.hasOwnProperty.call(context, uppercaseToken)) {
      return String(context[uppercaseToken] ?? 0);
    }
    if (Object.prototype.hasOwnProperty.call(context, match)) {
      return String(context[match] ?? 0);
    }
    return '0';
  });

  // Tokenize normalized arithmetic string
  const tokens = [];
  let numberBuffer = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (/\s/.test(char)) continue;

    if (/[0-9.]/.test(char)) {
      numberBuffer += char;
    } else {
      if (numberBuffer) {
        tokens.push(parseFloat(numberBuffer));
        numberBuffer = '';
      }
      if (['+', '-', '*', '/', '(', ')'].includes(char)) {
        tokens.push(char);
      }
    }
  }
  if (numberBuffer) {
    tokens.push(parseFloat(numberBuffer));
  }

  if (tokens.length === 0) return 0;

  // Shunting-yard algorithm: infix to RPN
  const outputQueue = [];
  const operatorStack = [];
  const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const token of tokens) {
    if (typeof token === 'number') {
      outputQueue.push(token);
    } else if (['+', '-', '*', '/'].includes(token)) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop());
      }
      operatorStack.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop());
      }
      if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] === '(') {
        operatorStack.pop();
      }
    }
  }
  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop());
  }

  // RPN evaluation
  const stack = [];
  for (const token of outputQueue) {
    if (typeof token === 'number') {
      stack.push(token);
    } else {
      const b = stack.pop() ?? 0;
      const a = stack.pop() ?? 0;
      switch (token) {
        case '+':
          stack.push(a + b);
          break;
        case '-':
          stack.push(a - b);
          break;
        case '*':
          stack.push(a * b);
          break;
        case '/':
          stack.push(b !== 0 ? a / b : 0);
          break;
        default:
          break;
      }
    }
  }

  const result = stack.pop() ?? 0;
  return isNaN(result) ? 0 : Math.max(0, Number(result.toFixed(2)));
};

/**
 * Evaluates condition expressions like "BASIC > 30000"
 * @param {string} conditionStr 
 * @param {Record<string, number>} context 
 * @returns {boolean}
 */
export const evaluateCondition = (conditionStr, context = {}) => {
  if (!conditionStr || !conditionStr.trim()) return true;

  const trimmed = conditionStr.trim();
  // Simple operator matching: >, <, >=, <=, ==, !=
  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*(>=|<=|==|!=|>|<)\s*([0-9.]+)/);
  if (!match) return true;

  const [, varName, op, valStr] = match;
  const varVal = context[varName.toUpperCase()] ?? 0;
  const targetVal = parseFloat(valStr) || 0;

  switch (op) {
    case '>':
      return varVal > targetVal;
    case '<':
      return varVal < targetVal;
    case '>=':
      return varVal >= targetVal;
    case '<=':
      return varVal <= targetVal;
    case '==':
      return varVal === targetVal;
    case '!=':
      return varVal !== targetVal;
    default:
      return true;
  }
};

/**
 * Calculates a single salary rule against context
 * @param {Object} rule 
 * @param {Record<string, number>} context 
 * @returns {{ amount: number, applied: boolean, details: string }}
 */
export const calculateRule = (rule, context = {}) => {
  if (!rule || !rule.isActive) {
    return { amount: 0, applied: false, details: 'Rule is inactive' };
  }

  // Evaluate condition if present
  if (rule.conditionExpression && !evaluateCondition(rule.conditionExpression, context)) {
    return { amount: 0, applied: false, details: `Condition not met: ${rule.conditionExpression}` };
  }

  const calcType = (rule.calculationType || rule.calculation_type || 'fixed').toLowerCase();
  let amount = 0;
  let details = '';

  if (calcType === 'fixed') {
    amount = Number(rule.value || 0);
    details = `Fixed Amount: ₹${amount.toLocaleString()}`;
  } else if (calcType === 'percentage') {
    const rate = Number(rule.value || 0);
    // Base is BASIC by default unless specified or Gross
    const baseCode = (rule.categoryCode || '').toUpperCase() === 'DEDUCTION' ? 'BASIC' : 'BASIC';
    const baseVal = context[baseCode] ?? context['BASIC'] ?? 0;
    amount = Number(((baseVal * rate) / 100).toFixed(2));
    details = `${rate}% of ${baseCode} (₹${baseVal.toLocaleString()})`;
  } else if (calcType === 'formula') {
    const formulaStr = rule.formulaExpression || rule.formula_expression || '';
    amount = evaluateFormula(formulaStr, context);
    details = `Formula (${formulaStr}) = ₹${amount.toLocaleString()}`;
  }

  return {
    amount: Math.max(0, Number(amount.toFixed(2))),
    applied: true,
    details,
  };
};

/**
 * Validates dependencies and sequence integrity for a list of rules
 * @param {Array} rules 
 * @returns {{ valid: boolean, errors: Array<string>, warnings: Array<string> }}
 */
export const validateStructureDependencies = (rules = []) => {
  const errors = [];
  const warnings = [];

  if (!rules || rules.length === 0) {
    return { valid: true, errors: [], warnings: ['Structure has no rules configured.'] };
  }

  // Check duplicate codes
  const codeMap = new Map();
  rules.forEach((r, idx) => {
    const code = (r.code || '').toUpperCase().trim();
    if (!code) {
      errors.push(`Rule at position ${idx + 1} is missing a rule code.`);
      return;
    }
    if (codeMap.has(code)) {
      errors.push(`Duplicate rule code '${code}' found in rules.`);
    } else {
      codeMap.set(code, r);
    }
  });

  // Sort rules by sequence ASC
  const sorted = [...rules].sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));
  const calculatedCodes = new Set(['BASIC', 'BASE', 'GROSS', 'DEDUCTIONS', 'NET']);

  sorted.forEach((rule) => {
    const currentCode = (rule.code || '').toUpperCase().trim();
    const formula = rule.formulaExpression || rule.formula_expression || '';
    const condition = rule.conditionExpression || rule.condition_expression || '';

    // Extract variables used in formula/condition
    const tokens = (formula + ' ' + condition).match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];

    tokens.forEach((token) => {
      const upperToken = token.toUpperCase();
      // Skip math operator keywords or basic numbers
      if (['AND', 'OR', 'IF', 'THEN'].includes(upperToken)) return;

      if (!calculatedCodes.has(upperToken) && codeMap.has(upperToken)) {
        const targetRule = codeMap.get(upperToken);
        if ((Number(targetRule.sequence) || 0) >= (Number(rule.sequence) || 0)) {
          errors.push(
            `Sequence Error: Rule '${currentCode}' (Seq ${rule.sequence}) references '${upperToken}' (Seq ${targetRule.sequence}), which is calculated later or on the same sequence.`
          );
        }
      } else if (!calculatedCodes.has(upperToken) && !codeMap.has(upperToken)) {
        warnings.push(
          `Rule '${currentCode}' references unknown variable '${upperToken}'. It will default to 0.`
        );
      }
    });

    calculatedCodes.add(currentCode);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Calculates entire Salary Structure in sequence order
 * @param {Object} structure 
 * @param {Array} rules 
 * @param {number} baseSalaryInput 
 * @returns {{ lines: Array, gross: number, deductions: number, net: number }}
 */
export const calculateSalaryStructure = (structure, rules = [], baseSalaryInput = 50000) => {
  const activeRules = rules
    .filter((r) => r.isActive ?? r.is_active ?? true)
    .sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

  const context = {
    BASIC: Number(baseSalaryInput || 0),
    BASE: Number(baseSalaryInput || 0),
    GROSS: 0,
    DEDUCTIONS: 0,
    NET: 0,
  };

  const lines = [];
  let accumGross = 0;
  let accumDeductions = 0;

  activeRules.forEach((rule) => {
    const code = (rule.code || '').toUpperCase().trim();
    const categoryName = (rule.categoryName || rule.category || 'Allowance').toLowerCase();

    const result = calculateRule(rule, context);
    const amount = result.amount;

    // Save calculation into context dictionary
    context[code] = amount;

    // Categorize totals
    if (categoryName.includes('basic') || categoryName.includes('allowance')) {
      accumGross += amount;
      context['GROSS'] = Number(accumGross.toFixed(2));
    } else if (categoryName.includes('gross')) {
      // If rule is Gross explicitly, use computed gross if amount is 0
      const grossVal = amount > 0 ? amount : accumGross;
      accumGross = grossVal;
      context['GROSS'] = Number(grossVal.toFixed(2));
    } else if (categoryName.includes('deduction')) {
      accumDeductions += amount;
      context['DEDUCTIONS'] = Number(accumDeductions.toFixed(2));
    } else if (categoryName.includes('net')) {
      const netVal = amount > 0 ? amount : Math.max(0, accumGross - accumDeductions);
      context['NET'] = Number(netVal.toFixed(2));
    }

    lines.push({
      ruleId: rule.id,
      ruleCode: rule.code,
      ruleName: rule.name,
      categoryName: rule.categoryName || 'Allowance',
      sequence: rule.sequence,
      calculationType: rule.calculationType || rule.calculation_type,
      amount,
      applied: result.applied,
      details: result.details,
    });
  });

  const gross = Math.max(0, Number(context['GROSS'] || accumGross).toFixed(2));
  const deductions = Math.max(0, Number(context['DEDUCTIONS'] || accumDeductions).toFixed(2));
  const net = Math.max(0, Number(context['NET'] || (gross - deductions)).toFixed(2));

  return {
    structureId: structure?.id || null,
    baseSalaryInput: Number(baseSalaryInput),
    lines,
    gross: Number(gross),
    deductions: Number(deductions),
    net: Number(net),
  };
};

/**
 * Exposes API-ready calculation definition for future Part 10 Payrun engine
 * @param {Object} structure 
 * @param {Array} rules 
 * @returns {Object}
 */
export const getPayrollCalculationDefinition = (structure, rules = []) => {
  const activeRules = rules
    .filter((r) => r.isActive ?? r.is_active ?? true)
    .sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

  return {
    structureId: structure.id,
    structureName: structure.name,
    structureCode: structure.code,
    ruleCount: activeRules.length,
    rules: activeRules.map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      sequence: r.sequence,
      calculationType: r.calculationType || r.calculation_type,
      value: r.value,
      conditionExpression: r.conditionExpression,
      formulaExpression: r.formulaExpression,
    })),
  };
};
