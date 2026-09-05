import BaseModel from './BaseModel.js';

export class SalaryRuleModel extends BaseModel {
  constructor() {
    super('salary_rules', 'id');
  }

  /**
   * Get single rule with structure and category details
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getRuleDetails(id, trx = null) {
    const rule = await this.query(trx)
      .leftJoin('salary_structures', 'salary_rules.salary_structure_id', 'salary_structures.id')
      .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id')
      .where('salary_rules.id', id)
      .select(
        'salary_rules.*',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'salary_rule_categories.name as category_name',
        'salary_rule_categories.code as category_code'
      )
      .first();

    if (!rule) return null;

    return {
      ...rule,
      value: Number(rule.value),
      sequence: parseInt(rule.sequence, 10),
      is_active: Boolean(rule.is_active)
    };
  }

  /**
   * List salary rules with filtering, pagination, and sorting
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async listRules(filter = {}, options = {}, trx = null) {
    const {
      page = 1,
      limit = 20,
      salary_structure_id,
      category_id,
      calculation_type,
      is_active,
      search,
      orderBy = 'salary_rules.sequence',
      orderDir = 'asc'
    } = options;

    let baseQuery = this.query(trx)
      .leftJoin('salary_structures', 'salary_rules.salary_structure_id', 'salary_structures.id')
      .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id');

    if (salary_structure_id) {
      baseQuery = baseQuery.where('salary_rules.salary_structure_id', salary_structure_id);
    }

    if (category_id) {
      baseQuery = baseQuery.where('salary_rules.category_id', category_id);
    }

    if (calculation_type) {
      baseQuery = baseQuery.where('salary_rules.calculation_type', calculation_type);
    }

    if (is_active !== undefined && is_active !== null) {
      baseQuery = baseQuery.where('salary_rules.is_active', Boolean(is_active));
    }

    if (search) {
      baseQuery = baseQuery.where(function () {
        this.where('salary_rules.name', 'like', `%${search}%`)
          .orWhere('salary_rules.code', 'like', `%${search}%`);
      });
    }

    if (filter && Object.keys(filter).length > 0) {
      baseQuery = baseQuery.where(filter);
    }

    // Total count query
    const countResult = await baseQuery.clone().count('salary_rules.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const data = await baseQuery
      .select(
        'salary_rules.*',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'salary_rule_categories.name as category_name',
        'salary_rule_categories.code as category_code'
      )
      .orderBy(orderBy, orderDir.toLowerCase() === 'asc' ? 'asc' : 'desc')
      .limit(parseInt(limit, 10))
      .offset(offset);

    return {
      data: data.map((r) => ({
        ...r,
        value: Number(r.value),
        sequence: parseInt(r.sequence, 10),
        is_active: Boolean(r.is_active)
      })),
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages
      }
    };
  }

  /**
   * Find rules by structure ID ordered by sequence
   * @param {number|string} structureId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByStructureId(structureId, trx = null) {
    const rules = await this.query(trx)
      .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id')
      .where({
        'salary_rules.salary_structure_id': structureId,
        'salary_rules.is_active': true,
      })
      .select(
        'salary_rules.*',
        'salary_rule_categories.name as category_name',
        'salary_rule_categories.code as category_code'
      )
      .orderBy('salary_rules.sequence', 'asc');

    return rules.map((r) => ({
      ...r,
      value: Number(r.value),
      sequence: parseInt(r.sequence, 10),
      is_active: Boolean(r.is_active)
    }));
  }
}

export default new SalaryRuleModel();
