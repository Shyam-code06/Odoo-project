import {
  db,
  TimeOffAllocationModel,
  TimeOffRequestModel,
  TimeOffTypeModel,
  EmployeeModel
} from '../models/index.js';

export class TimeOffService {
  // ===========================================================================
  // ALLOCATION MANAGEMENT
  // ===========================================================================

  /**
   * List time off allocations with search, filters, pagination, and RBAC scoping
   * @param {object} params
   * @param {object} user - Authenticated user
   */
  async getAllocations(params = {}, user) {
    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    const employeeId = isEmployee ? user.employee_id : params.employee_id ? Number(params.employee_id) : null;

    const options = {
      page: Math.max(1, parseInt(params.page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20)),
      employee_id: employeeId,
      time_off_type_id: params.time_off_type_id ? Number(params.time_off_type_id) : null,
      status: params.status ? params.status.trim().toLowerCase() : null,
      orderBy: ['id', 'start_date', 'end_date', 'allocated_amount', 'created_at'].includes(params.sortBy)
        ? `time_off_allocations.${params.sortBy}`
        : 'time_off_allocations.id',
      orderDir: (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    };

    const result = await TimeOffAllocationModel.listAllocations({}, options);

    // Compute remaining available balance for each allocation in the response
    const enrichedData = result.data.map((alloc) => ({
      ...alloc,
      allocated_amount: Number(alloc.allocated_amount),
      used_amount: Number(alloc.used_amount),
      available_amount: Math.max(0, Number(alloc.allocated_amount) - Number(alloc.used_amount))
    }));

    return {
      data: enrichedData,
      pagination: result.pagination
    };
  }

  /**
   * Get single allocation by ID with ownership protection
   * @param {number|string} id
   * @param {object} user
   */
  async getAllocationById(id, user) {
    const allocation = await TimeOffAllocationModel.getAllocationDetails(id);
    if (!allocation) {
      const error = new Error(`Time off allocation with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    if (isEmployee && Number(allocation.employee_id) !== Number(user.employee_id)) {
      const error = new Error('You are not authorized to view allocations belonging to another employee');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return {
      ...allocation,
      allocated_amount: Number(allocation.allocated_amount),
      used_amount: Number(allocation.used_amount),
      available_amount: Math.max(0, Number(allocation.allocated_amount) - Number(allocation.used_amount))
    };
  }

  /**
   * HR creates a new leave allocation
   * @param {object} data
   * @param {object} user
   */
  async createAllocation(data, user) {
    const { employee_id, time_off_type_id, start_date, end_date, allocated_amount } = data;

    // 1. Verify target employee exists and is active
    const employee = await EmployeeModel.findById(employee_id);
    if (!employee) {
      const error = new Error(`Employee with ID ${employee_id} does not exist`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    if (employee.employment_status === 'terminated') {
      const error = new Error('Cannot allocate leave to a terminated employee');
      error.statusCode = 400;
      error.code = 'EMPLOYEE_TERMINATED';
      throw error;
    }

    // 2. Verify time off type exists and is active
    const timeOffType = await TimeOffTypeModel.findById(time_off_type_id);
    if (!timeOffType) {
      const error = new Error(`Time off type with ID ${time_off_type_id} does not exist`);
      error.statusCode = 404;
      error.code = 'TIME_OFF_TYPE_NOT_FOUND';
      throw error;
    }

    if (!timeOffType.is_active) {
      const error = new Error(`Time off type '${timeOffType.name}' is inactive`);
      error.statusCode = 400;
      error.code = 'TIME_OFF_TYPE_INACTIVE';
      throw error;
    }

    // 3. Insert allocation in 'pending' status
    const created = await TimeOffAllocationModel.create({
      employee_id,
      time_off_type_id,
      start_date,
      end_date,
      allocated_amount: Number(allocated_amount),
      used_amount: 0.0,
      status: 'pending',
      approved_by: null,
      approved_at: null
    });

    return await this.getAllocationById(created.id, user);
  }

  /**
   * HR approves a pending allocation
   * @param {number|string} id
   * @param {object} user
   */
  async approveAllocation(id, user) {
    const allocation = await TimeOffAllocationModel.findById(id);
    if (!allocation) {
      const error = new Error(`Time off allocation with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (allocation.status !== 'pending') {
      const error = new Error(`Cannot approve an allocation that is already in '${allocation.status}' status`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    await TimeOffAllocationModel.updateById(id, {
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date(),
      updated_at: new Date()
    });

    return await this.getAllocationById(id, user);
  }

  /**
   * HR rejects a pending allocation
   * @param {number|string} id
   * @param {object} user
   */
  async rejectAllocation(id, user) {
    const allocation = await TimeOffAllocationModel.findById(id);
    if (!allocation) {
      const error = new Error(`Time off allocation with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (allocation.status !== 'pending') {
      const error = new Error(`Cannot reject an allocation that is already in '${allocation.status}' status`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    await TimeOffAllocationModel.updateById(id, {
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date(),
      updated_at: new Date()
    });

    return await this.getAllocationById(id, user);
  }

  /**
   * Get available leave balance summary for an employee across all leave types
   * Available = allocated_amount - used_amount
   * @param {number|string} employeeId
   * @param {object} user
   */
  async getEmployeeBalance(employeeId, user) {
    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    const targetEmpId = isEmployee ? user.employee_id : Number(employeeId || user.employee_id);

    if (!targetEmpId) {
      const error = new Error('No employee profile associated with this request');
      error.statusCode = 400;
      error.code = 'NO_EMPLOYEE_PROFILE';
      throw error;
    }

    if (isEmployee && Number(targetEmpId) !== Number(user.employee_id)) {
      const error = new Error('You are not authorized to view leave balance for another employee');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const employee = await EmployeeModel.findById(targetEmpId);
    if (!employee) {
      const error = new Error(`Employee with ID ${targetEmpId} does not exist`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    // 1. Fetch active leave types
    const leaveTypes = await TimeOffTypeModel.findAll({ is_active: true });

    // 2. Fetch all approved allocations for the employee
    const approvedAllocations = await db('time_off_allocations')
      .where({ employee_id: targetEmpId, status: 'approved' });

    // 3. Compute balances per time off type
    const balances = leaveTypes.map((type) => {
      const typeAllocations = approvedAllocations.filter(
        (a) => Number(a.time_off_type_id) === Number(type.id)
      );

      const totalAllocated = typeAllocations.reduce((sum, a) => sum + Number(a.allocated_amount), 0);
      const totalUsed = typeAllocations.reduce((sum, a) => sum + Number(a.used_amount), 0);
      const available = Math.max(0, totalAllocated - totalUsed);

      return {
        time_off_type_id: type.id,
        name: type.name,
        code: type.code,
        unit: type.unit,
        requires_allocation: Boolean(type.requires_allocation),
        is_paid: Boolean(type.is_paid),
        allocated_amount: Number(totalAllocated.toFixed(2)),
        used_amount: Number(totalUsed.toFixed(2)),
        available: Number(available.toFixed(2)),
        allocations_count: typeAllocations.length
      };
    });

    return {
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        name: `${employee.first_name} ${employee.last_name}`,
        email: employee.email
      },
      balances
    };
  }

  // ===========================================================================
  // LEAVE REQUEST MANAGEMENT
  // ===========================================================================

  /**
   * List leave requests with filters, pagination, and RBAC scoping
   * @param {object} params
   * @param {object} user
   */
  async getLeaveRequests(params = {}, user) {
    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    const employeeId = isEmployee ? user.employee_id : params.employee_id ? Number(params.employee_id) : null;

    const options = {
      page: Math.max(1, parseInt(params.page, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20)),
      employee_id: employeeId,
      time_off_type_id: params.time_off_type_id ? Number(params.time_off_type_id) : null,
      status: params.status ? params.status.trim().toLowerCase() : null,
      orderBy: ['id', 'start_date', 'end_date', 'duration', 'created_at'].includes(params.sortBy)
        ? `time_off_requests.${params.sortBy}`
        : 'time_off_requests.id',
      orderDir: (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc'
    };

    const result = await TimeOffRequestModel.listRequests({}, options);
    return result;
  }

  /**
   * Get single leave request by ID with ownership enforcement
   * @param {number|string} id
   * @param {object} user
   */
  async getLeaveRequestById(id, user) {
    const request = await TimeOffRequestModel.getRequestDetails(id);
    if (!request) {
      const error = new Error(`Time off request with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    if (isEmployee && Number(request.employee_id) !== Number(user.employee_id)) {
      const error = new Error('You are not authorized to view leave requests belonging to another employee');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    return request;
  }

  /**
   * Submit a new leave request (Employee self-service or HR on behalf)
   * Validates duration <= available balance, no date overlap, and links allocation
   * @param {object} data
   * @param {object} user
   */
  async createLeaveRequest(data, user) {
    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    let targetEmpId = data.employee_id ? Number(data.employee_id) : user.employee_id;

    if (isEmployee) {
      // Employees can only request leave for themselves
      targetEmpId = user.employee_id;
    }

    if (!targetEmpId) {
      const error = new Error('No employee profile associated with this user account');
      error.statusCode = 400;
      error.code = 'NO_EMPLOYEE_PROFILE';
      throw error;
    }

    const { time_off_type_id, start_date, end_date, duration, reason } = data;

    // 1. Verify employee exists and is active
    const employee = await EmployeeModel.findById(targetEmpId);
    if (!employee) {
      const error = new Error(`Employee with ID ${targetEmpId} does not exist`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    if (employee.employment_status !== 'active') {
      const error = new Error(`Cannot submit leave request for employee with '${employee.employment_status}' status`);
      error.statusCode = 400;
      error.code = 'EMPLOYEE_NOT_ACTIVE';
      throw error;
    }

    // 2. Verify time off type exists and is active
    const timeOffType = await TimeOffTypeModel.findById(time_off_type_id);
    if (!timeOffType) {
      const error = new Error(`Time off type with ID ${time_off_type_id} does not exist`);
      error.statusCode = 404;
      error.code = 'TIME_OFF_TYPE_NOT_FOUND';
      throw error;
    }

    if (!timeOffType.is_active) {
      const error = new Error(`Time off type '${timeOffType.name}' is currently inactive`);
      error.statusCode = 400;
      error.code = 'TIME_OFF_TYPE_INACTIVE';
      throw error;
    }

    // 3. Check for overlapping pending or approved leave requests
    const overlapping = await TimeOffRequestModel.findOverlappingRequest(targetEmpId, start_date, end_date);
    if (overlapping) {
      const error = new Error(
        `Employee already has a ${overlapping.status} leave request from ${overlapping.start_date.slice(0, 10)} to ${overlapping.end_date.slice(0, 10)}`
      );
      error.statusCode = 409;
      error.code = 'OVERLAPPING_LEAVE_REQUEST';
      throw error;
    }

    // 4. Verify allocation & available balance
    let matchedAllocation = null;

    if (timeOffType.requires_allocation) {
      // Find valid approved allocation covering dates or active with remaining balance
      // Priority A: Allocation covering the specific date window
      matchedAllocation = await TimeOffAllocationModel.findValidAllocationForRange(
        targetEmpId,
        time_off_type_id,
        start_date,
        end_date
      );

      // Priority B: Any active approved allocation covering start_date with available balance
      if (!matchedAllocation) {
        matchedAllocation = await db('time_off_allocations')
          .where({ employee_id: targetEmpId, time_off_type_id, status: 'approved' })
          .where('start_date', '<=', start_date)
          .where('end_date', '>=', end_date)
          .first();
      }

      // Priority C: Any approved allocation for this leave type with available balance
      if (!matchedAllocation) {
        matchedAllocation = await db('time_off_allocations')
          .where({ employee_id: targetEmpId, time_off_type_id, status: 'approved' })
          .whereRaw('allocated_amount > used_amount')
          .orderBy('start_date', 'asc')
          .first();
      }

      if (!matchedAllocation) {
        const error = new Error('No valid approved leave allocation found for this leave type');
        error.statusCode = 400;
        error.code = 'NO_VALID_ALLOCATION';
        throw error;
      }

      const available = Number(matchedAllocation.allocated_amount) - Number(matchedAllocation.used_amount);
      if (Number(duration) > available) {
        const error = new Error(
          `Request duration (${duration}) exceeds available leave balance (${available.toFixed(2)})`
        );
        error.statusCode = 400;
        error.code = 'INSUFFICIENT_BALANCE';
        throw error;
      }
    }

    // 5. Create leave request in 'pending' status
    // Note: used_amount on allocation does NOT increase yet (only on HR approval)
    const created = await TimeOffRequestModel.create({
      employee_id: targetEmpId,
      time_off_type_id,
      allocation_id: matchedAllocation ? matchedAllocation.id : null,
      start_date,
      end_date,
      duration: Number(duration),
      reason: reason || null,
      status: 'pending',
      approved_by: null,
      approved_at: null,
      rejected_reason: null
    });

    return await this.getLeaveRequestById(created.id, user);
  }

  /**
   * HR approves a pending leave request
   * Atomically updates request status and allocation used_amount inside a Knex transaction
   * @param {number|string} id
   * @param {object} user
   */
  async approveLeaveRequest(id, user) {
    const existing = await TimeOffRequestModel.findById(id);
    if (!existing) {
      const error = new Error(`Time off request with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (existing.status !== 'pending') {
      const error = new Error(`Cannot approve a leave request that is already in '${existing.status}' status`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    // Call atomic approveRequest on model (runs inside Knex transaction)
    const approved = await TimeOffRequestModel.approveRequest(id, user.id);
    return approved;
  }

  /**
   * HR rejects a pending leave request
   * Does NOT alter allocation used_amount
   * @param {number|string} id
   * @param {object} user
   * @param {string} [rejectedReason]
   */
  async rejectLeaveRequest(id, user, rejectedReason = '') {
    const existing = await TimeOffRequestModel.findById(id);
    if (!existing) {
      const error = new Error(`Time off request with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (existing.status !== 'pending') {
      const error = new Error(`Cannot reject a leave request that is already in '${existing.status}' status`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const rejected = await TimeOffRequestModel.rejectRequest(id, user.id, rejectedReason);
    return rejected;
  }

  /**
   * Employee cancels their own pending leave request
   * @param {number|string} id
   * @param {object} user
   */
  async cancelLeaveRequest(id, user) {
    const existing = await TimeOffRequestModel.findById(id);
    if (!existing) {
      const error = new Error(`Time off request with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const isEmployee = (user.role_name || '').trim().toLowerCase() === 'employee';
    if (isEmployee && Number(existing.employee_id) !== Number(user.employee_id)) {
      const error = new Error('You are not authorized to cancel a request belonging to another employee');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    if (existing.status !== 'pending') {
      const error = new Error(`Cannot cancel a leave request that is already in '${existing.status}' status`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    await TimeOffRequestModel.updateById(id, {
      status: 'cancelled',
      updated_at: new Date()
    });

    return await this.getLeaveRequestById(id, user);
  }
}

export default new TimeOffService();
