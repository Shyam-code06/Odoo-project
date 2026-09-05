import BaseModel from './BaseModel.js';

export class SalaryRuleModel extends BaseModel {
  constructor() {
    super('salary_rules', 'id');
  }

  /**
   * Find rules by structure ID ordered by sequence
   * @param {number|string} structureId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByStructureId(structureId, trx = null) {
    return await this.query(trx)
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
  }
}

export default new SalaryRuleModel();
