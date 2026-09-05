import { db, SalaryRuleCategoryModel } from '../models/index.js';

export class SalaryRuleCategoryService {
  /**
   * Get salary rule categories with search, pagination, and sorting
   * @param {object} params
   */
  async getSalaryRuleCategories(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;
    const sortBy = ['id', 'name', 'code', 'created_at'].includes(params.sortBy)
      ? `salary_rule_categories.${params.sortBy}`
      : 'salary_rule_categories.id';
    const sortOrder = (params.sortOrder || params.orderDir || 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    let baseQuery = db('salary_rule_categories')
      .leftJoin('salary_rule_categories as parent', 'salary_rule_categories.parent_id', 'parent.id');

    if (search) {
      baseQuery = baseQuery.where((builder) => {
        builder
          .where('salary_rule_categories.name', 'like', `%${search}%`)
          .orWhere('salary_rule_categories.code', 'like', `%${search}%`);
      });
    }

    const countResult = await baseQuery.clone().count('salary_rule_categories.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const data = await baseQuery
      .select(
        'salary_rule_categories.id',
        'salary_rule_categories.name',
        'salary_rule_categories.code',
        'salary_rule_categories.parent_id',
        'salary_rule_categories.description',
        'salary_rule_categories.created_at',
        'salary_rule_categories.updated_at',
        'parent.name as parent_name',
        'parent.code as parent_code'
      )
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get salary rule category by ID
   * @param {number|string} id
   */
  async getSalaryRuleCategoryById(id) {
    const category = await db('salary_rule_categories')
      .leftJoin('salary_rule_categories as parent', 'salary_rule_categories.parent_id', 'parent.id')
      .where('salary_rule_categories.id', id)
      .select(
        'salary_rule_categories.id',
        'salary_rule_categories.name',
        'salary_rule_categories.code',
        'salary_rule_categories.parent_id',
        'salary_rule_categories.description',
        'salary_rule_categories.created_at',
        'salary_rule_categories.updated_at',
        'parent.name as parent_name',
        'parent.code as parent_code'
      )
      .first();

    return category || null;
  }

  /**
   * Create a new salary rule category
   * @param {object} categoryData
   */
  async createSalaryRuleCategory(categoryData) {
    const { name, code, parent_id, description } = categoryData;

    // 1. Verify code uniqueness
    const existingCode = await SalaryRuleCategoryModel.findOne({ code });
    if (existingCode) {
      const error = new Error('Salary rule category code already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_CODE';
      throw error;
    }

    // 2. Verify parent_id if provided
    if (parent_id) {
      const parentExists = await SalaryRuleCategoryModel.findById(parent_id);
      if (!parentExists) {
        const error = new Error(`Parent category with ID ${parent_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_PARENT';
        throw error;
      }
    }

    // 3. Insert record
    const created = await SalaryRuleCategoryModel.create({
      name,
      code,
      parent_id: parent_id || null,
      description: description || null
    });

    return await this.getSalaryRuleCategoryById(created.id);
  }

  /**
   * Update salary rule category by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateSalaryRuleCategory(id, updateData) {
    const existing = await SalaryRuleCategoryModel.findById(id);
    if (!existing) {
      const error = new Error('Salary rule category not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Verify code uniqueness if updating code
    if (updateData.code && updateData.code !== existing.code) {
      const conflict = await db('salary_rule_categories')
        .where({ code: updateData.code })
        .whereNot({ id })
        .first();

      if (conflict) {
        const error = new Error('Salary rule category code already exists');
        error.statusCode = 409;
        error.code = 'DUPLICATE_CODE';
        throw error;
      }
    }

    // Verify parent if updated
    if (updateData.parent_id) {
      if (Number(updateData.parent_id) === Number(id)) {
        const error = new Error('Category cannot be its own parent');
        error.statusCode = 400;
        error.code = 'CIRCULAR_PARENT';
        throw error;
      }
      const parentExists = await SalaryRuleCategoryModel.findById(updateData.parent_id);
      if (!parentExists) {
        const error = new Error(`Parent category with ID ${updateData.parent_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_PARENT';
        throw error;
      }
    }

    const payload = { ...updateData };
    delete payload.id;

    await SalaryRuleCategoryModel.updateById(id, payload);
    return await this.getSalaryRuleCategoryById(id);
  }

  /**
   * Delete salary rule category with reference check protection
   * @param {number|string} id
   */
  async deleteSalaryRuleCategory(id) {
    const existing = await SalaryRuleCategoryModel.findById(id);
    if (!existing) {
      const error = new Error('Salary rule category not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in salary_rules and child categories
    const [ruleCount, childCount] = await Promise.all([
      db('salary_rules').where({ category_id: id }).count('id as total').first(),
      db('salary_rule_categories').where({ parent_id: id }).count('id as total').first()
    ]);

    const totalRules = parseInt(ruleCount?.total, 10) || 0;
    const totalChildren = parseInt(childCount?.total, 10) || 0;

    if (totalRules > 0) {
      const error = new Error('Salary rule category cannot be deleted because it is being used by salary rules.');
      error.statusCode = 409;
      error.code = 'RECORD_REFERENCED';
      throw error;
    }

    if (totalChildren > 0) {
      const error = new Error('Salary rule category cannot be deleted because other categories depend on it as parent.');
      error.statusCode = 409;
      error.code = 'PARENT_REFERENCED';
      throw error;
    }

    await SalaryRuleCategoryModel.deleteById(id);
    return true;
  }
}

export default new SalaryRuleCategoryService();
