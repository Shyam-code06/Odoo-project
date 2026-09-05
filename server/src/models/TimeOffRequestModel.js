import BaseModel from './BaseModel.js';

export class TimeOffRequestModel extends BaseModel {
  constructor() {
    super('time_off_requests', 'id');
  }

  /**
   * Get leave request by ID with joined employee and type info
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
        'approver.email as approver_email'
      )
      .first();
  }

  /**
   * List leave requests with filters
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async listRequests(filter = {}, options = {}, trx = null) {
    const { page, limit, status, employee_id, orderBy = 'time_off_requests.id', orderDir = 'desc' } = options;

    let q = this.query(trx)
      .leftJoin('employees', 'time_off_requests.employee_id', 'employees.id')
      .leftJoin('time_off_types', 'time_off_requests.time_off_type_id', 'time_off_types.id')
      .select(
        'time_off_requests.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'time_off_types.name as leave_type_name',
        'time_off_types.code as leave_type_code'
      );

    if (status) {
      q = q.where('time_off_requests.status', status);
    }

    if (employee_id) {
      q = q.where('time_off_requests.employee_id', employee_id);
    }

    if (filter && Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    if (page && limit) {
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      q = q.limit(parseInt(limit, 10)).offset(offset);
    }

    return await q.orderBy(orderBy, orderDir);
  }

  /**
   * Approve leave request and update allocation used amount in a transaction
   * @param {number|string} requestId
   * @param {number|string} approverUserId
   */
  async approveRequest(requestId, approverUserId) {
    return await this.transaction(async (trx) => {
      const request = await this.findById(requestId, ['*'], trx);
      if (!request) {
        throw new Error(`Time off request with ID ${requestId} not found`);
      }

      if (request.status === 'approved') {
        return request;
      }

      // If tied to an allocation, increment used_amount
      if (request.allocation_id) {
        await trx('time_off_allocations')
          .where({ id: request.allocation_id })
          .increment('used_amount', request.duration);
      }

      const updated = await this.updateById(
        requestId,
        {
          status: 'approved',
          approved_by: approverUserId,
          approved_at: new Date(),
        },
        trx
      );

      return updated;
    });
  }

  /**
   * Reject leave request
   * @param {number|string} requestId
   * @param {number|string} approverUserId
   * @param {string} rejectedReason
   */
  async rejectRequest(requestId, approverUserId, rejectedReason = '') {
    return await this.updateById(requestId, {
      status: 'rejected',
      approved_by: approverUserId,
      approved_at: new Date(),
      rejected_reason: rejectedReason,
    });
  }
}

export default new TimeOffRequestModel();
