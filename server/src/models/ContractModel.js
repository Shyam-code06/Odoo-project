import BaseModel from './BaseModel.js';

export class ContractModel extends BaseModel {
  constructor() {
    super('contracts', 'id');
  }

  /**
   * Find contract by unique contract number
   * @param {string} contractNumber
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByContractNumber(contractNumber, trx = null) {
    return await this.findOne({ contract_number: contractNumber }, ['*'], trx);
  }

  /**
   * Get active contract for an employee
   * @param {number|string} employeeId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getActiveContractByEmployeeId(employeeId, trx = null) {
    return await this.query(trx)
      .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
      .leftJoin('working_schedules', 'contracts.working_schedule_id', 'working_schedules.id')
      .where({
        'contracts.employee_id': employeeId,
        'contracts.status': 'active'
      })
      .select(
        'contracts.*',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'working_schedules.name as schedule_name'
      )
      .first();
  }

  /**
   * Get detailed contract with relations
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getContractDetails(id, trx = null) {
    return await this.query(trx)
      .leftJoin('employees', 'contracts.employee_id', 'employees.id')
      .leftJoin('departments', 'contracts.department_id', 'departments.id')
      .leftJoin('job_positions', 'contracts.job_position_id', 'job_positions.id')
      .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
      .leftJoin('working_schedules', 'contracts.working_schedule_id', 'working_schedules.id')
      .where('contracts.id', id)
      .select(
        'contracts.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'departments.name as department_name',
        'job_positions.title as job_position_title',
        'salary_structures.name as salary_structure_name',
        'working_schedules.name as schedule_name'
      )
      .first();
  }
}

export default new ContractModel();
