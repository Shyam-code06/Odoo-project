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
   * Get structure with its associated rules
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getStructureWithRules(id, trx = null) {
    const structure = await this.findById(id, ['*'], trx);
    if (!structure) return null;

    const rules = await (trx ? trx('salary_rules') : this.db('salary_rules'))
      .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id')
      .where({ 'salary_rules.salary_structure_id': id })
      .select(
        'salary_rules.*',
        'salary_rule_categories.name as category_name',
        'salary_rule_categories.code as category_code'
      )
      .orderBy('salary_rules.sequence', 'asc');

    return {
      ...structure,
      rules,
    };
  }
}

export default new SalaryStructureModel();
