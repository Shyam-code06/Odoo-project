import BaseModel from './BaseModel.js';

export class TimeOffAllocationModel extends BaseModel {
  constructor() {
    super('time_off_allocations', 'id');
  }

  /**
   * Get allocations for an employee with type details
   * @param {number|string} employeeId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getEmployeeAllocations(employeeId, trx = null) {
    return await this.query(trx)
      .leftJoin('time_off_types', 'time_off_allocations.time_off_type_id', 'time_off_types.id')
      .leftJoin('users as approver', 'time_off_allocations.approved_by', 'approver.id')
      .where('time_off_allocations.employee_id', employeeId)
      .select(
        'time_off_allocations.*',
        'time_off_types.name as time_off_type_name',
        'time_off_types.code as time_off_type_code',
        'time_off_types.unit',
        'approver.email as approver_email'
      );
  }

  /**
   * Find valid allocation for employee and leave type covering date
   * @param {number|string} employeeId
   * @param {number|string} typeId
   * @param {string} date
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findValidAllocation(employeeId, typeId, date, trx = null) {
    return await this.query(trx)
      .where('employee_id', employeeId)
      .where('time_off_type_id', typeId)
      .where('status', 'approved')
      .where('start_date', '<=', date)
      .where('end_date', '>=', date)
      .first();
  }
}

export default new TimeOffAllocationModel();
