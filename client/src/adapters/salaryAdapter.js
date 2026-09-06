/**
 * Salary Adapter Layer
 * Transforms raw database-shaped Structures, Categories, and Rules into UI models.
 */

export const salaryStructureAdapter = {
  toUIModel: (struct, rules = [], contracts = []) => {
    if (!struct) return null;

    const structRules = rules.filter(
      (r) => String(r.salaryStructureId || r.salary_structure_id) === String(struct.id)
    );
    const activeRules = structRules.filter((r) => r.isActive ?? r.is_active ?? true);
    
    const matchingContracts = contracts.filter(
      (c) =>
        String(c.salaryStructureId || c.salary_structure_id) === String(struct.id) &&
        String(c.status || '').toLowerCase() === 'active'
    );
    const employeeCount = struct.employee_count ?? struct.employeeCount ?? matchingContracts.length;

    return {
      id: struct.id,
      name: struct.name || '',
      code: struct.code || '',
      description: struct.description || '',
      isActive: struct.isActive ?? struct.is_active ?? true,
      ruleCount: structRules.length,
      activeRuleCount: activeRules.length,
      employeeCount,
      createdAt: struct.createdAt || struct.created_at || new Date().toISOString(),
      updatedAt: struct.updatedAt || struct.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      name: uiData.name ? uiData.name.trim() : '',
      code: uiData.code ? uiData.code.trim().toUpperCase() : '',
      description: uiData.description ? uiData.description.trim() : '',
      is_active: Boolean(uiData.isActive),
    };
  },
};

export const salaryRuleCategoryAdapter = {
  toUIModel: (cat, rules = []) => {
    if (!cat) return null;
    const count = rules.filter((r) => r.category_id === cat.id || r.categoryId === cat.id).length;
    return {
      id: cat.id,
      name: cat.name || '',
      code: cat.code || '',
      description: cat.description || '',
      ruleCount: count,
    };
  },

  toAPIModel: (uiData) => {
    return {
      name: uiData.name ? uiData.name.trim() : '',
      code: uiData.code ? uiData.code.trim().toUpperCase() : '',
      description: uiData.description ? uiData.description.trim() : '',
    };
  },
};

export const salaryRuleAdapter = {
  toUIModel: (rule, structures = [], categories = []) => {
    if (!rule) return null;

    const structureId = rule.salaryStructureId || rule.salary_structure_id;
    const categoryId = rule.categoryId || rule.category_id;

    const struct = structures.find((s) => s.id === structureId);
    const cat = categories.find((c) => c.id === categoryId);

    const calcType = (rule.calculationType || rule.calculation_type || 'fixed').toLowerCase();
    const value = rule.value !== undefined ? Number(rule.value) : null;

    let formattedValue = '—';
    if (calcType === 'fixed') {
      formattedValue = `₹${(value || 0).toLocaleString()}`;
    } else if (calcType === 'percentage') {
      formattedValue = `${value || 0}%`;
    } else if (calcType === 'formula') {
      formattedValue = rule.formulaExpression || rule.formula_expression || 'Formula';
    }

    return {
      id: rule.id,
      salaryStructureId: structureId,
      salaryStructure: struct
        ? { id: struct.id, name: struct.name, code: struct.code }
        : { id: structureId, name: 'Unknown Structure', code: '' },
      categoryId,
      category: cat
        ? { id: cat.id, name: cat.name, code: cat.code }
        : { id: categoryId, name: 'Allowance', code: 'ALW' },
      categoryName: cat ? cat.name : 'Allowance',
      categoryCode: cat ? cat.code : 'ALW',
      name: rule.name || '',
      code: rule.code || '',
      sequence: Number(rule.sequence || 10),
      calculationType: calcType,
      value,
      formattedValue,
      conditionExpression: rule.conditionExpression || rule.condition_expression || '',
      formulaExpression: rule.formulaExpression || rule.formula_expression || '',
      isActive: rule.isActive ?? rule.is_active ?? true,
      createdAt: rule.createdAt || rule.created_at || new Date().toISOString(),
      updatedAt: rule.updatedAt || rule.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      salary_structure_id: uiData.salaryStructureId,
      category_id: uiData.categoryId,
      name: uiData.name ? uiData.name.trim() : '',
      code: uiData.code ? uiData.code.trim().toUpperCase() : '',
      sequence: Number(uiData.sequence || 10),
      calculation_type: uiData.calculationType || 'fixed',
      value: uiData.value !== undefined && uiData.value !== '' ? Number(uiData.value) : null,
      condition_expression: uiData.conditionExpression ? uiData.conditionExpression.trim() : null,
      formula_expression: uiData.formulaExpression ? uiData.formulaExpression.trim() : null,
      is_active: Boolean(uiData.isActive),
    };
  },
};
