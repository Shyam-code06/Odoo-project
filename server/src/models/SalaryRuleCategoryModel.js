import BaseModel from './BaseModel.js';

export class SalaryRuleCategoryModel extends BaseModel {
  constructor() {
    super('salary_rule_categories', 'id');
  }

  /**
   * Find category by code
   * @param {string} code
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(code, trx = null) {
    return await this.findOne({ code }, ['*'], trx);
  }

  /**
   * Get category hierarchy
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getHierarchy(trx = null) {
    return await this.query(trx)
      .leftJoin('salary_rule_categories as parent', 'salary_rule_categories.parent_id', 'parent.id')
      .select(
        'salary_rule_categories.*',
        'parent.name as parent_name',
        'parent.code as parent_code'
      )
      .orderBy('salary_rule_categories.id', 'asc');
  }
}

export default new SalaryRuleCategoryModel();
