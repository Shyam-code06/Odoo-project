import BaseModel from './BaseModel.js';

export class PayrunEmployeeModel extends BaseModel {
  constructor() {
    super('payrun_employees', 'id');
  }

  /**
   * Find employees assigned to a payrun
   * @param {number|string} payrunId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByPayrunId(payrunId, trx = null) {
    return await this.query(trx)
      .leftJoin('employees', 'payrun_employees.employee_id', 'employees.id')
      .leftJoin('contracts', 'payrun_employees.contract_id', 'contracts.id')
      .where('payrun_employees.payrun_id', payrunId)
      .select(
        'payrun_employees.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'contracts.wage',
        'contracts.contract_number'
      );
  }
}

export default new PayrunEmployeeModel();
