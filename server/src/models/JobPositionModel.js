import BaseModel from './BaseModel.js';

export class JobPositionModel extends BaseModel {
  constructor() {
    super('job_positions', 'id');
  }

  /**
   * Find position by code
   * @param {string} code
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(code, trx = null) {
    return await this.findOne({ code }, ['*'], trx);
  }

  /**
   * Get job positions with department names and active employee count
   * @param {object} [filter={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getPositionsWithDetails(filter = {}, trx = null) {
    return await this.query(trx)
      .leftJoin('departments', 'job_positions.department_id', 'departments.id')
      .leftJoin('employees', 'job_positions.id', 'employees.job_position_id')
      .where(filter)
      .select(
        'job_positions.*',
        'departments.name as department_name',
        'departments.code as department_code'
      )
      .count('employees.id as employee_count')
      .groupBy('job_positions.id');
  }
}

export default new JobPositionModel();
