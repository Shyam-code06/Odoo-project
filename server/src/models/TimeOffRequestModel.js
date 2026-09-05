import BaseModel from './BaseModel.js';

export class TimeOffRequestModel extends BaseModel {
  constructor() {
    super('time_off_requests', 'id');
  }

  /**
   * Get leave request by ID with joined employee, type, and allocation info
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getRequestDetails(id, trx = null) {
    return await this.query(trx)
      .leftJoin('employees', 'time_off_requests.employee_id', 'employees.id')
      .leftJoin('time_off_types', 'time_off_requests.time_off_type_id', 'time_off_types.id')
      .leftJoin('time_off_allocations', 'time_off_requests.allocation_id', 'time_off_allocations.id')
      .leftJoin('users as approver', 'time_off_requests.approved_by', 'approver.id')
      .where('time_off_requests.id', id)
      .select(
        'time_off_requests.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'time_off_types.name as leave_type_name',
        'time_off_types.code as leave_type_code',
        'time_off_types.unit',
        'time_off_allocations.allocated_amount as allocation_allocated',
        'time_off_allocations.used_amount as allocation_used',
        'approver.email as approver_email'
      )
      .first();
  }

  /**
   * List leave requests with filters and pagination
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async listRequests(filter = {}, options = {}, trx = null) {
    const {
      page = 1,
      limit = 20,
      status,
      employee_id,
      time_off_type_id,
      orderBy = 'time_off_requests.id',
      orderDir = 'desc'
    } = options;

    let q = this.query(trx)
      .leftJoin('employees', 'time_off_requests.employee_id', 'employees.id')
      .leftJoin('time_off_types', 'time_off_requests.time_off_type_id', 'time_off_types.id')
      .leftJoin('users as approver', 'time_off_requests.approved_by', 'approver.id')
      .select(
        'time_off_requests.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'time_off_types.name as leave_type_name',
        'time_off_types.code as leave_type_code',
        'time_off_types.unit',
        'approver.email as approver_email'
      );

    if (status) {
      q = q.where('time_off_requests.status', status);
    }

    if (employee_id) {
      q = q.where('time_off_requests.employee_id', employee_id);
    }

    if (time_off_type_id) {
      q = q.where('time_off_requests.time_off_type_id', time_off_type_id);
    }

    if (filter && Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    // Count query
    const countResult = await q.clone().clearSelect().count('time_off_requests.id as total').first();
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
   * Check for overlapping pending or approved leave requests for an employee
   * @param {number|string} employeeId
   * @param {string} startDate
   * @param {string} endDate
   * @param {number|string} [excludeId]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findOverlappingRequest(employeeId, startDate, endDate, excludeId = null, trx = null) {
    let q = this.query(trx)
      .where('employee_id', employeeId)
      .whereIn('status', ['pending', 'approved'])
      .where('start_date', '<=', endDate)
      .where('end_date', '>=', startDate);

    if (excludeId) {
      q = q.whereNot('id', excludeId);
    }

    return await q.first();
  }

  /**
   * Approve leave request and update allocation used amount in an atomic transaction
   * @param {number|string} requestId
   * @param {number|string} approverUserId
   */
  async approveRequest(requestId, approverUserId) {
    return await this.transaction(async (trx) => {
      // 1. Fetch request with row lock if possible
      const request = await this.query(trx).where({ id: requestId }).first();
      if (!request) {
        const error = new Error(`Time off request with ID ${requestId} not found`);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (request.status !== 'pending') {
        const error = new Error(`Cannot approve a request that is already in '${request.status}' status`);
        error.statusCode = 400;
        error.code = 'INVALID_STATUS_TRANSITION';
        throw error;
      }

      // 2. If tied to an allocation, verify available balance and update
      if (request.allocation_id) {
        const allocation = await trx('time_off_allocations')
          .where({ id: request.allocation_id })
          .first();

        if (!allocation) {
          const error = new Error(`Tied allocation ID ${request.allocation_id} not found`);
          error.statusCode = 400;
          error.code = 'ALLOCATION_NOT_FOUND';
          throw error;
        }

        if (allocation.status !== 'approved') {
          const error = new Error('Cannot approve request because tied allocation is not in approved status');
          error.statusCode = 400;
          error.code = 'ALLOCATION_NOT_APPROVED';
          throw error;
        }

        const available = Number(allocation.allocated_amount) - Number(allocation.used_amount);
        if (Number(request.duration) > available) {
          const error = new Error(
            `Insufficient allocation balance upon approval. Available: ${available}, requested: ${request.duration}`
          );
          error.statusCode = 400;
          error.code = 'INSUFFICIENT_BALANCE';
          throw error;
        }

        await trx('time_off_allocations')
          .where({ id: request.allocation_id })
          .increment('used_amount', request.duration);
      }

      // 3. Mark request as approved
      await this.query(trx)
        .where({ id: requestId })
        .update({
          status: 'approved',
          approved_by: approverUserId,
          approved_at: new Date(),
          updated_at: new Date()
        });

      return await this.getRequestDetails(requestId, trx);
    });
  }

  /**
   * Reject leave request (used_amount remains untouched)
   * @param {number|string} requestId
   * @param {number|string} approverUserId
   * @param {string} [rejectedReason]
   */
  async rejectRequest(requestId, approverUserId, rejectedReason = '') {
    const request = await this.findById(requestId);
    if (!request) {
      const error = new Error(`Time off request with ID ${requestId} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (request.status !== 'pending') {
      const error = new Error(`Cannot reject a request that is already in '${request.status}' status`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    await this.updateById(requestId, {
      status: 'rejected',
      approved_by: approverUserId,
      approved_at: new Date(),
      rejected_reason: rejectedReason || null,
      updated_at: new Date()
    });

    return await this.getRequestDetails(requestId);
  }
}

export default new TimeOffRequestModel();
