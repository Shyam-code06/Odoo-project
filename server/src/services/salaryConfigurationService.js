import {
  db,
  SalaryStructureModel,
  SalaryRuleModel,
  SalaryRuleCategoryModel
} from '../models/index.js';

export class SalaryConfigurationService {
  // ===========================================================================
  // SALARY STRUCTURES
  // ===========================================================================

  /**
   * Get salary structures with search, active filter, pagination, and sorting
   * @param {object} params
   */
  async getStructures(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const search = params.search ? params.search.trim() : null;
    const isActive =
      params.is_active !== undefined && params.is_active !== ''
        ? params.is_active === 'true' || params.is_active === true || params.is_active === '1'
        : null;

    const sortBy = ['id', 'name', 'code', 'created_at'].includes(params.sortBy)
      ? `salary_structures.${params.sortBy}`
      : 'salary_structures.id';
    const sortOrder = (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const result = await SalaryStructureModel.listStructures(
      {},
      {
        page,
        limit,
        search,
        is_active: isActive,
        orderBy: sortBy,
        orderDir: sortOrder
      }
    );

    return result;
  }

  /**
   * Get single salary structure by ID with all its rules sorted by sequence ASC
   * @param {number|string} id
   * @param {object} [options={}]
   */
  async getStructureById(id, options = {}) {
    const structure = await SalaryStructureModel.getStructureWithRules(id, options);
    if (!structure) {
      const error = new Error(`Salary structure with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return structure;
  }

  /**
   * Create a new salary structure template
   * @param {object} data
   */
  async createStructure(data) {
    const { name, code, description, is_active } = data;

    // 1. Check code uniqueness
    const existing = await SalaryStructureModel.findOne({ code });
    if (existing) {
      const error = new Error(`Salary structure code '${code}' already exists`);
      error.statusCode = 409;
      error.code = 'DUPLICATE_CODE';
      throw error;
    }

    // 2. Insert record
    const created = await SalaryStructureModel.create({
      name,
      code,
      description: description || null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    });

    return await this.getStructureById(created.id);
  }

  /**
   * Update salary structure by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateStructure(id, updateData) {
    const existing = await SalaryStructureModel.findById(id);
    if (!existing) {
      const error = new Error(`Salary structure with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Verify code uniqueness if updated
    if (updateData.code && updateData.code !== existing.code) {
      const conflict = await db('salary_structures')
        .where({ code: updateData.code })
        .whereNot({ id })
        .first();

      if (conflict) {
        const error = new Error(`Salary structure code '${updateData.code}' already exists`);
        error.statusCode = 409;
        error.code = 'DUPLICATE_CODE';
        throw error;
      }
    }

    const payload = { ...updateData };
    delete payload.id;
    delete payload.created_at;
    payload.updated_at = new Date();

    await SalaryStructureModel.updateById(id, payload);
    return await this.getStructureById(id);
  }

  /**
   * Update active/inactive status of salary structure
   * @param {number|string} id
   * @param {boolean} isActive
   */
  async updateStructureStatus(id, isActive) {
    const existing = await SalaryStructureModel.findById(id);
    if (!existing) {
      const error = new Error(`Salary structure with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await SalaryStructureModel.updateById(id, {
      is_active: Boolean(isActive),
      updated_at: new Date()
    });

    return await this.getStructureById(id);
  }

  /**
   * Delete salary structure with referential check protection
   * @param {number|string} id
   */
  async deleteStructure(id) {
    const existing = await SalaryStructureModel.findById(id);
    if (!existing) {
      const error = new Error(`Salary structure with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in contracts and payslips
    const [contractCount, payslipCount] = await Promise.all([
      db('contracts').where({ salary_structure_id: id }).count('id as total').first(),
      db('payslips').where({ salary_structure_id: id }).count('id as total').first()
    ]);

    const totalReferences =
      (parseInt(contractCount?.total, 10) || 0) +
      (parseInt(payslipCount?.total, 10) || 0);

    if (totalReferences > 0) {
      const error = new Error('Salary structure cannot be deleted because it is referenced by contracts or payslips.');
      error.statusCode = 409;
      error.code = 'RECORD_REFERENCED';
      throw error;
    }

    // Delete attached rules and structure in transaction
    await db.transaction(async (trx) => {
      await trx('salary_rules').where({ salary_structure_id: id }).del();
      await trx('salary_structures').where({ id }).del();
    });

    return true;
  }

  // ===========================================================================
  // SALARY RULES
  // ===========================================================================

  /**
   * List salary rules with filters, pagination, and sorting
   * @param {object} params
   */
  async getRules(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const search = params.search ? params.search.trim() : null;
    const structureId = params.salary_structure_id ? Number(params.salary_structure_id) : null;
    const categoryId = params.category_id ? Number(params.category_id) : null;
    const calculationType = params.calculation_type ? params.calculation_type.trim().toLowerCase() : null;
    const isActive =
      params.is_active !== undefined && params.is_active !== ''
        ? params.is_active === 'true' || params.is_active === true || params.is_active === '1'
        : null;

    const sortBy = ['id', 'name', 'code', 'sequence', 'created_at'].includes(params.sortBy)
      ? `salary_rules.${params.sortBy}`
      : 'salary_rules.sequence';
    const sortOrder = (params.sortOrder || params.orderDir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    const result = await SalaryRuleModel.listRules(
      {},
      {
        page,
        limit,
        salary_structure_id: structureId,
        category_id: categoryId,
        calculation_type: calculationType,
        is_active: isActive,
        search,
        orderBy: sortBy,
        orderDir: sortOrder
      }
    );

    return result;
  }

  /**
   * Get single salary rule by ID with category and structure metadata
   * @param {number|string} id
   */
  async getRuleById(id) {
    const rule = await SalaryRuleModel.getRuleDetails(id);
    if (!rule) {
      const error = new Error(`Salary rule with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return rule;
  }

  /**
   * Create a new salary rule
   * @param {object} ruleData
   */
  async createRule(ruleData) {
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
    } = ruleData;

    // 1. Verify referenced salary structure exists
    const structure = await SalaryStructureModel.findById(salary_structure_id);
    if (!structure) {
      const error = new Error(`Referenced salary structure with ID ${salary_structure_id} does not exist`);
      error.statusCode = 400;
      error.code = 'INVALID_STRUCTURE';
      throw error;
    }

    // 2. Verify referenced category exists
    const category = await SalaryRuleCategoryModel.findById(category_id);
    if (!category) {
      const error = new Error(`Referenced category with ID ${category_id} does not exist`);
      error.statusCode = 400;
      error.code = 'INVALID_CATEGORY';
      throw error;
    }

    // 3. Verify rule code uniqueness within the same structure
    const existingRule = await db('salary_rules')
      .where({ salary_structure_id, code })
      .first();

    if (existingRule) {
      const error = new Error(
        `Salary rule code '${code}' already exists within structure '${structure.name}'`
      );
      error.statusCode = 409;
      error.code = 'DUPLICATE_RULE_CODE';
      throw error;
    }

    // 4. Insert rule
    const created = await SalaryRuleModel.create({
      salary_structure_id,
      category_id,
      name,
      code,
      sequence: sequence !== undefined ? Number(sequence) : 1,
      calculation_type,
      value: value !== undefined ? Number(value) : 0.0,
      condition_expression: condition_expression || null,
      formula_expression: formula_expression || null,
      is_active: is_active !== undefined ? Boolean(is_active) : true
    });

    return await this.getRuleById(created.id);
  }

  /**
   * Update salary rule by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateRule(id, updateData) {
    const existing = await SalaryRuleModel.findById(id);
    if (!existing) {
      const error = new Error(`Salary rule with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const structureId = updateData.salary_structure_id || existing.salary_structure_id;
    const ruleCode = updateData.code || existing.code;

    // Verify structure if updated
    if (updateData.salary_structure_id) {
      const structure = await SalaryStructureModel.findById(updateData.salary_structure_id);
      if (!structure) {
        const error = new Error(`Referenced salary structure with ID ${updateData.salary_structure_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_STRUCTURE';
        throw error;
      }
    }

    // Verify category if updated
    if (updateData.category_id) {
      const category = await SalaryRuleCategoryModel.findById(updateData.category_id);
      if (!category) {
        const error = new Error(`Referenced category with ID ${updateData.category_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_CATEGORY';
        throw error;
      }
    }

    // Verify code uniqueness within the structure if code or structure changed
    if (
      (updateData.code && updateData.code !== existing.code) ||
      (updateData.salary_structure_id && updateData.salary_structure_id !== existing.salary_structure_id)
    ) {
      const conflict = await db('salary_rules')
        .where({ salary_structure_id: structureId, code: ruleCode })
        .whereNot({ id })
        .first();

      if (conflict) {
        const error = new Error(
          `Salary rule code '${ruleCode}' already exists within the target structure`
        );
        error.statusCode = 409;
        error.code = 'DUPLICATE_RULE_CODE';
        throw error;
      }
    }

    const payload = { ...updateData };
    delete payload.id;
    delete payload.created_at;
    payload.updated_at = new Date();

    await SalaryRuleModel.updateById(id, payload);
    return await this.getRuleById(id);
  }

  /**
   * Update active/inactive status of salary rule
   * @param {number|string} id
   * @param {boolean} isActive
   */
  async updateRuleStatus(id, isActive) {
    const existing = await SalaryRuleModel.findById(id);
    if (!existing) {
      const error = new Error(`Salary rule with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await SalaryRuleModel.updateById(id, {
      is_active: Boolean(isActive),
      updated_at: new Date()
    });

    return await this.getRuleById(id);
  }

  /**
   * Delete salary rule with referential check protection
   * @param {number|string} id
   */
  async deleteRule(id) {
    const existing = await SalaryRuleModel.findById(id);
    if (!existing) {
      const error = new Error(`Salary rule with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in payslip_lines
    const payslipLineCount = await db('payslip_lines')
      .where({ salary_rule_id: id })
      .count('id as total')
      .first();

    const totalReferences = parseInt(payslipLineCount?.total, 10) || 0;
    if (totalReferences > 0) {
      const error = new Error('Salary rule cannot be deleted because historical payslip lines reference it.');
      error.statusCode = 409;
      error.code = 'RECORD_REFERENCED';
      throw error;
    }

    await SalaryRuleModel.deleteById(id);
    return true;
  }
}

export default new SalaryConfigurationService();
