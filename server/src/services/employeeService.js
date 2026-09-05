import {
  db,
  EmployeeModel,
  DepartmentModel,
  JobPositionModel,
  WorkingScheduleModel
} from '../models/index.js';
import { hashPassword } from '../utils/password.js';

export class EmployeeService {
  /**
   * Get paginated employees list with search, filters, sorting, and joined metadata
   * @param {object} params
   */
  async getEmployees(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const search = params.search ? params.search.trim() : null;
    const departmentId = params.department_id ? Number(params.department_id) : null;
    const jobPositionId = params.job_position_id ? Number(params.job_position_id) : null;
    const workingScheduleId = params.working_schedule_id ? Number(params.working_schedule_id) : null;
    const employmentStatus = params.employment_status ? params.employment_status.trim().toLowerCase() : null;

    const allowedSortFields = [
      'id',
      'employee_code',
      'first_name',
      'last_name',
      'email',
      'joining_date',
      'employment_status',
      'created_at'
    ];
    const sortBy = allowedSortFields.includes(params.sortBy)
      ? `employees.${params.sortBy}`
      : 'employees.id';
    const sortOrder = (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let baseQuery = db('employees')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('working_schedules', 'employees.working_schedule_id', 'working_schedules.id')
      .leftJoin('employees as mgr', 'employees.manager_id', 'mgr.id');

    // Search filter across employee_code, first_name, last_name, email
    if (search) {
      baseQuery = baseQuery.where((builder) => {
        builder
          .where('employees.employee_code', 'like', `%${search}%`)
          .orWhere('employees.first_name', 'like', `%${search}%`)
          .orWhere('employees.last_name', 'like', `%${search}%`)
          .orWhere('employees.email', 'like', `%${search}%`);
      });
    }

    // Specific filters
    if (departmentId) {
      baseQuery = baseQuery.where('employees.department_id', departmentId);
    }

    if (jobPositionId) {
      baseQuery = baseQuery.where('employees.job_position_id', jobPositionId);
    }

    if (workingScheduleId) {
      baseQuery = baseQuery.where('employees.working_schedule_id', workingScheduleId);
    }

    if (employmentStatus) {
      baseQuery = baseQuery.where('employees.employment_status', employmentStatus);
    }

    // Count total matching records
    const countResult = await baseQuery.clone().count('employees.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch paginated records with clean joins
    const data = await baseQuery
      .select(
        'employees.id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'employees.email',
        'employees.phone',
        'employees.date_of_birth',
        'employees.address',
        'employees.joining_date',
        'employees.employment_status',
        'employees.department_id',
        'employees.job_position_id',
        'employees.manager_id',
        'employees.working_schedule_id',
        'employees.created_at',
        'employees.updated_at',
        'departments.name as department_name',
        'departments.code as department_code',
        'job_positions.title as job_position_title',
        'job_positions.code as job_position_code',
        'working_schedules.name as working_schedule_name',
        db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name"),
        'mgr.employee_code as manager_code',
        'mgr.email as manager_email'
      )
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single employee by ID with related relationships and summary/count metrics
   * @param {number|string} id
   */
  async getEmployeeById(id) {
    const employee = await db('employees')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('working_schedules', 'employees.working_schedule_id', 'working_schedules.id')
      .leftJoin('employees as mgr', 'employees.manager_id', 'mgr.id')
      .where('employees.id', id)
      .select(
        'employees.id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'employees.email',
        'employees.phone',
        'employees.date_of_birth',
        'employees.address',
        'employees.joining_date',
        'employees.employment_status',
        'employees.department_id',
        'employees.job_position_id',
        'employees.manager_id',
        'employees.working_schedule_id',
        'employees.created_at',
        'employees.updated_at',
        'departments.name as department_name',
        'departments.code as department_code',
        'job_positions.title as job_position_title',
        'job_positions.code as job_position_code',
        'working_schedules.name as working_schedule_name',
        db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name"),
        'mgr.employee_code as manager_code',
        'mgr.email as manager_email'
      )
      .first();

    if (!employee) return null;

    // Fetch related module counts (summary metrics)
    const [contractsRes, attendanceRes, timeOffRes, payslipsRes] = await Promise.all([
      db('contracts').where({ employee_id: id }).count('id as total').first(),
      db('attendance').where({ employee_id: id }).count('id as total').first(),
      db('time_off_requests').where({ employee_id: id }).count('id as total').first(),
      db('payslips').where({ employee_id: id }).count('id as total').first()
    ]);

    return {
      ...employee,
      summary: {
        contracts_count: parseInt(contractsRes?.total, 10) || 0,
        attendance_count: parseInt(attendanceRes?.total, 10) || 0,
        time_off_requests_count: parseInt(timeOffRes?.total, 10) || 0,
        payslips_count: parseInt(payslipsRes?.total, 10) || 0
      }
    };
  }

  /**
   * Validate related foreign keys
   * @param {object} data
   * @param {number|string} [targetId]
   */
  async validateEmployeeRelations(data, targetId = null) {
    // 1. Department existence
    if (data.department_id) {
      const dept = await DepartmentModel.findById(data.department_id);
      if (!dept) {
        const error = new Error(`Referenced department with ID ${data.department_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_DEPARTMENT';
        throw error;
      }
    }

    // 2. Job Position existence
    if (data.job_position_id) {
      const pos = await JobPositionModel.findById(data.job_position_id);
      if (!pos) {
        const error = new Error(`Referenced job position with ID ${data.job_position_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_JOB_POSITION';
        throw error;
      }
    }

    // 3. Working Schedule existence
    if (data.working_schedule_id) {
      const schedule = await WorkingScheduleModel.findById(data.working_schedule_id);
      if (!schedule) {
        const error = new Error(`Referenced working schedule with ID ${data.working_schedule_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_WORKING_SCHEDULE';
        throw error;
      }
    }

    // 4. Manager existence and self-manager prevention
    if (data.manager_id) {
      if (targetId && Number(data.manager_id) === Number(targetId)) {
        const error = new Error('An employee cannot be their own manager');
        error.statusCode = 400;
        error.code = 'SELF_MANAGER';
        throw error;
      }

      const manager = await EmployeeModel.findById(data.manager_id);
      if (!manager) {
        const error = new Error(`Referenced manager employee with ID ${data.manager_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_MANAGER';
        throw error;
      }
    }
  }

  /**
   * Create new employee
   * @param {object} data
   */
  async createEmployee(data) {
    const {
      employee_code,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      address,
      department_id,
      job_position_id,
      manager_id,
      joining_date,
      employment_status,
      working_schedule_id
    } = data;

    // 1. Verify employee_code uniqueness
    const existingCode = await EmployeeModel.findOne({ employee_code });
    if (existingCode) {
      const error = new Error('Employee code already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMPLOYEE_CODE';
      throw error;
    }

    // 2. Verify email uniqueness
    const existingEmail = await EmployeeModel.findOne({ email });
    if (existingEmail) {
      const error = new Error('Employee email already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_EMAIL';
      throw error;
    }

    // 3. Verify foreign key relations
    await this.validateEmployeeRelations(data);

    // 4. Insert employee
    const created = await EmployeeModel.create({
      employee_code,
      first_name,
      last_name,
      email,
      phone: phone || null,
      date_of_birth: date_of_birth || null,
      address: address || null,
      department_id: department_id || null,
      job_position_id: job_position_id || null,
      manager_id: manager_id || null,
      joining_date,
      employment_status: employment_status || 'active',
      working_schedule_id: working_schedule_id || null
    });

    // 5. If portal user login is provided, create/link user account
    if (data.password && data.password.trim().length >= 6) {
      const password_hash = await hashPassword(data.password.trim());
      let roleId = 4; // Default: Employee

      if (data.role_id) {
        if (!isNaN(Number(data.role_id))) {
          roleId = Number(data.role_id);
        } else {
          const roleRecord = await db('roles')
            .where('name', data.role_id)
            .orWhere('code', data.role_id)
            .first();
          if (roleRecord) roleId = roleRecord.id;
        }
      } else if (data.role) {
        const roleRecord = await db('roles')
          .where('name', data.role)
          .orWhere('code', data.role)
          .first();
        if (roleRecord) roleId = roleRecord.id;
      }

      const userEmail = email.trim().toLowerCase();
      const existingUser = await db('users').where({ email: userEmail }).first();
      if (!existingUser) {
        await db('users').insert({
          email: userEmail,
          password_hash,
          role_id: roleId,
          employee_id: created.id,
          is_active: 1,
          created_at: db.fn.now(),
          updated_at: db.fn.now()
        });
      } else {
        await db('users').where({ id: existingUser.id }).update({
          password_hash,
          role_id: roleId,
          employee_id: created.id,
          is_active: 1,
          updated_at: db.fn.now()
        });
      }
    }

    return await this.getEmployeeById(created.id);
  }

  /**
   * Update employee by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateEmployee(id, updateData) {
    const existing = await EmployeeModel.findById(id);
    if (!existing) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Verify employee_code uniqueness if updated
    if (updateData.employee_code && updateData.employee_code !== existing.employee_code) {
      const codeConflict = await db('employees')
        .where({ employee_code: updateData.employee_code })
        .whereNot({ id })
        .first();

      if (codeConflict) {
        const error = new Error('Employee code already exists');
        error.statusCode = 409;
        error.code = 'DUPLICATE_EMPLOYEE_CODE';
        throw error;
      }
    }

    // Verify email uniqueness if updated
    if (updateData.email && updateData.email !== existing.email) {
      const emailConflict = await db('employees')
        .where({ email: updateData.email })
        .whereNot({ id })
        .first();

      if (emailConflict) {
        const error = new Error('Employee email already exists');
        error.statusCode = 409;
        error.code = 'DUPLICATE_EMAIL';
        throw error;
      }
    }

    // Verify relations and self-manager prevention
    await this.validateEmployeeRelations(updateData, id);

    // Prepare payload (protect id and created_at)
    const payload = { ...updateData };
    const newPassword = payload.password;
    const newRoleId = payload.role_id;
    delete payload.id;
    delete payload.created_at;
    delete payload.password;
    delete payload.role_id;
    delete payload.role;
    payload.updated_at = new Date();

    await EmployeeModel.updateById(id, payload);

    // Update linked user password/role if provided
    if (newPassword && newPassword.trim().length >= 6) {
      const password_hash = await hashPassword(newPassword.trim());
      const userUpdates = { password_hash, updated_at: db.fn.now() };
      if (newRoleId) {
        userUpdates.role_id = Number(newRoleId);
      }
      await db('users')
        .where('employee_id', id)
        .orWhere('email', existing.email)
        .update(userUpdates);
    } else if (newRoleId) {
      await db('users')
        .where('employee_id', id)
        .orWhere('email', existing.email)
        .update({ role_id: Number(newRoleId), updated_at: db.fn.now() });
    }

    return await this.getEmployeeById(id);
  }

  /**
   * Update employee status
   * @param {number|string} id
   * @param {string} status
   */
  async updateEmployeeStatus(id, status) {
    const existing = await EmployeeModel.findById(id);
    if (!existing) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    await EmployeeModel.updateById(id, {
      employment_status: status,
      updated_at: new Date()
    });

    return await this.getEmployeeById(id);
  }

  /**
   * Delete employee with historical records protection
   * @param {number|string} id
   */
  async deleteEmployee(id) {
    const existing = await EmployeeModel.findById(id);
    if (!existing) {
      const error = new Error('Employee not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in historical tables
    const [contractsCount, attendanceCount, timeOffCount, payslipsCount, directReportsCount] =
      await Promise.all([
        db('contracts').where({ employee_id: id }).count('id as total').first(),
        db('attendance').where({ employee_id: id }).count('id as total').first(),
        db('time_off_requests').where({ employee_id: id }).count('id as total').first(),
        db('payslips').where({ employee_id: id }).count('id as total').first(),
        db('employees').where({ manager_id: id }).count('id as total').first()
      ]);

    const totalHistoricalRecords =
      (parseInt(contractsCount?.total, 10) || 0) +
      (parseInt(attendanceCount?.total, 10) || 0) +
      (parseInt(timeOffCount?.total, 10) || 0) +
      (parseInt(payslipsCount?.total, 10) || 0);

    if (totalHistoricalRecords > 0) {
      const error = new Error(
        'Employee cannot be deleted because historical records (contracts, attendance, time-off, or payslips) exist. Please deactivate the employee instead.'
      );
      error.statusCode = 409;
      error.code = 'HISTORICAL_RECORDS_EXIST';
      throw error;
    }

    if ((parseInt(directReportsCount?.total, 10) || 0) > 0) {
      const error = new Error(
        'Employee cannot be deleted because they are assigned as manager to other active employees. Please reassign direct reports first.'
      );
      error.statusCode = 409;
      error.code = 'MANAGER_ASSIGNED';
      throw error;
    }

    await EmployeeModel.deleteById(id);
    return true;
  }
}

export default new EmployeeService();
