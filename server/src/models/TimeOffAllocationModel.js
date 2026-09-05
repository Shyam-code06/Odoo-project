import BaseModel from './BaseModel.js';

export class TimeOffAllocationModel extends BaseModel {
  constructor() {
    super('time_off_allocations', 'id');
  }

  /**
   * Get single allocation with joined employee and type details
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getAllocationDetails(id, trx = null) {
    return await this.query(trx)
      .leftJoin('employees', 'time_off_allocations.employee_id', 'employees.id')
      .leftJoin('time_off_types', 'time_off_allocations.time_off_type_id', 'time_off_types.id')
      .leftJoin('users as approver', 'time_off_allocations.approved_by', 'approver.id')
      .where('time_off_allocations.id', id)
      .select(
        'time_off_allocations.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'time_off_types.name as time_off_type_name',
        'time_off_types.code as time_off_type_code',
        'time_off_types.unit',
        'approver.email as approver_email'
      )
      .first();
  }

  /**
   * List allocations with filtering and pagination
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async listAllocations(filter = {}, options = {}, trx = null) {
    const {
      page = 1,
      limit = 20,
      employee_id,
      time_off_type_id,
      status,
      orderBy = 'time_off_allocations.id',
      orderDir = 'desc'
    } = options;

    let q = this.query(trx)
      .leftJoin('employees', 'time_off_allocations.employee_id', 'employees.id')
      .leftJoin('time_off_types', 'time_off_allocations.time_off_type_id', 'time_off_types.id')
      .leftJoin('users as approver', 'time_off_allocations.approved_by', 'approver.id')
      .select(
        'time_off_allocations.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'time_off_types.name as time_off_type_name',
        'time_off_types.code as time_off_type_code',
        'time_off_types.unit',
        'approver.email as approver_email'
      );

    if (employee_id) {
      q = q.where('time_off_allocations.employee_id', employee_id);
    }

    if (time_off_type_id) {
      q = q.where('time_off_allocations.time_off_type_id', time_off_type_id);
    }

    if (status) {
      q = q.where('time_off_allocations.status', status);
    }

    if (filter && Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    // Count query
    const countResult = await q.clone().clearSelect().count('time_off_allocations.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

    const data = await q
      .orderBy(orderBy, orderDir.toLowerCase() === 'asc' ? 'asc' : 'desc')
      .limit(parseInt(limit, 10))
      .offset(offset);

    return {
      data,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages
      }
    };
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
      )
      .orderBy('time_off_allocations.start_date', 'desc');
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

  /**
   * Find valid approved allocation covering a date range with remaining balance
   * @param {number|string} employeeId
   * @param {number|string} typeId
   * @param {string} startDate
   * @param {string} endDate
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findValidAllocationForRange(employeeId, typeId, startDate, endDate, trx = null) {
    return await this.query(trx)
      .where('employee_id', employeeId)
      .where('time_off_type_id', typeId)
      .where('status', 'approved')
      .where('start_date', '<=', startDate)
      .where('end_date', '>=', endDate)
      .andWhere(function () {
        this.whereRaw('allocated_amount > used_amount');
      })
      .orderBy('start_date', 'asc')
      .first();
  }
}

export default new TimeOffAllocationModel();
