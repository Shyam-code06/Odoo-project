import BaseModel from './BaseModel.js';

export class SalaryStructureModel extends BaseModel {
  constructor() {
    super('salary_structures', 'id');
  }

  /**
   * Find structure by code
   * @param {string} code
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(code, trx = null) {
    return await this.findOne({ code }, ['*'], trx);
  }

  /**
   * List salary structures with search, active filter, pagination, and rule count
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async listStructures(filter = {}, options = {}, trx = null) {
    const {
      page = 1,
      limit = 20,
      search,
      is_active,
      orderBy = 'salary_structures.id',
      orderDir = 'desc'
    } = options;

    let q = this.query(trx)
      .select('salary_structures.*')
      .count('salary_rules.id as rules_count')
      .leftJoin('salary_rules', 'salary_structures.id', 'salary_rules.salary_structure_id')
      .groupBy('salary_structures.id');

    if (is_active !== undefined && is_active !== null) {
      q = q.where('salary_structures.is_active', Boolean(is_active));
    }

    if (search) {
      q = q.where(function () {
        this.where('salary_structures.name', 'like', `%${search}%`)
          .orWhere('salary_structures.code', 'like', `%${search}%`);
      });
    }

    if (filter && Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    // Count distinct total structures
    const countQuery = this.query(trx);
    if (is_active !== undefined && is_active !== null) {
      countQuery.where('salary_structures.is_active', Boolean(is_active));
    }
    if (search) {
      countQuery.where(function () {
        this.where('salary_structures.name', 'like', `%${search}%`)
          .orWhere('salary_structures.code', 'like', `%${search}%`);
      });
    }
    const countResult = await countQuery.count('id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const data = await q
      .orderBy(orderBy, orderDir.toLowerCase() === 'asc' ? 'asc' : 'desc')
      .limit(parseInt(limit, 10))
      .offset(offset);

    return {
      data: data.map((item) => ({
        ...item,
        is_active: Boolean(item.is_active),
        rules_count: parseInt(item.rules_count, 10) || 0
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
   * Get structure with its associated rules ordered by sequence ASC
   * @param {number|string} id
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getStructureWithRules(id, options = {}, trx = null) {
    const structure = await this.findById(id, ['*'], trx);
    if (!structure) return null;

    let rulesQuery = (trx ? trx('salary_rules') : this.db('salary_rules'))
      .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id')
      .where({ 'salary_rules.salary_structure_id': id })
      .select(
        'salary_rules.*',
        'salary_rule_categories.name as category_name',
        'salary_rule_categories.code as category_code'
      );

    if (options.activeOnly) {
      rulesQuery = rulesQuery.where('salary_rules.is_active', true);
    }

    const rules = await rulesQuery.orderBy('salary_rules.sequence', 'asc');

    return {
      ...structure,
      is_active: Boolean(structure.is_active),
      rules: rules.map((r) => ({
        ...r,
        value: Number(r.value),
        sequence: parseInt(r.sequence, 10),
        is_active: Boolean(r.is_active)
      }))
    };
  }
}

export default new SalaryStructureModel();
