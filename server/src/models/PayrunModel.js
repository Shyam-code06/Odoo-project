import BaseModel from './BaseModel.js';

export class PayrunModel extends BaseModel {
  constructor() {
    super('payruns', 'id');
  }

  /**
   * Get payrun details with creator, structure, employee summary, and payslips summary
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getDetailsById(id, trx = null) {
    const payrun = await this.query(trx)
      .leftJoin('salary_structures', 'payruns.salary_structure_id', 'salary_structures.id')
      .leftJoin('users as creator', 'payruns.created_by', 'creator.id')
      .where('payruns.id', id)
      .select(
        'payruns.*',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'creator.email as creator_email'
      )
      .first();

    if (!payrun) return null;

    const employees = await (trx ? trx('payrun_employees') : this.db('payrun_employees'))
      .leftJoin('employees', 'payrun_employees.employee_id', 'employees.id')
      .leftJoin('contracts', 'payrun_employees.contract_id', 'contracts.id')
      .where('payrun_employees.payrun_id', id)
      .select(
        'payrun_employees.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'contracts.wage',
        'contracts.contract_number'
      );

    const payslips = await (trx ? trx('payslips') : this.db('payslips'))
      .where({ payrun_id: id })
      .select('*');

    return {
      ...payrun,
      employees,
      payslips,
    };
  }
}

export default new PayrunModel();
