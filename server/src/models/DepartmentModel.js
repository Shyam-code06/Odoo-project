import BaseModel from './BaseModel.js';

export class DepartmentModel extends BaseModel {
  constructor() {
    super('departments', 'id');
  }

  /**
   * Find department by code
   * @param {string} code
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(code, trx = null) {
    return await this.findOne({ code }, ['*'], trx);
  }

  /**
   * Get all departments with manager name and total employee count
   * @param {object} [filter={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getDepartmentsWithStats(filter = {}, trx = null) {
    return await this.query(trx)
      .leftJoin('employees as mgr', 'departments.manager_id', 'mgr.id')
      .leftJoin('employees as emp', 'departments.id', 'emp.department_id')
      .where(filter)
      .select(
        'departments.*',
        this.db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name"),
        'mgr.email as manager_email'
      )
      .count('emp.id as total_employees')
      .groupBy('departments.id');
  }
}

export default new DepartmentModel();
