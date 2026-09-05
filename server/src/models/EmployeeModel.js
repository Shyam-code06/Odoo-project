import BaseModel from './BaseModel.js';

export class EmployeeModel extends BaseModel {
  constructor() {
    super('employees', 'id');
  }

  /**
   * Find employee by unique employee code
   * @param {string} employeeCode
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(employeeCode, trx = null) {
    return await this.findOne({ employee_code: employeeCode }, ['*'], trx);
  }

  /**
   * Find employee by email
   * @param {string} email
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByEmail(email, trx = null) {
    return await this.findOne({ email }, ['*'], trx);
  }

  /**
   * Get employee with comprehensive joined relations
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getDetailsById(id, trx = null) {
    return await this.query(trx)
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('employees as mgr', 'employees.manager_id', 'mgr.id')
      .leftJoin('working_schedules', 'employees.working_schedule_id', 'working_schedules.id')
      .leftJoin('users', 'employees.id', 'users.employee_id')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .where('employees.id', id)
      .select(
        'employees.*',
        'departments.name as department_name',
        'departments.code as department_code',
        'job_positions.title as job_position_title',
        'job_positions.code as job_position_code',
        this.db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name"),
        'mgr.employee_code as manager_code',
        'working_schedules.name as schedule_name',
        'users.id as user_id',
        'users.email as user_login_email',
        'roles.name as user_role'
      )
      .first();
  }

  /**
   * List employees with relations, search, and pagination
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async listEmployees(filter = {}, options = {}, trx = null) {
    const { page, limit, search, department_id, employment_status, orderBy = 'employees.id', orderDir = 'desc' } = options;

    let q = this.query(trx)
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('employees as mgr', 'employees.manager_id', 'mgr.id')
      .select(
        'employees.*',
        'departments.name as department_name',
        'job_positions.title as job_position_title',
        this.db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name")
      );

    if (department_id) {
      q = q.where('employees.department_id', department_id);
    }

    if (employment_status) {
      q = q.where('employees.employment_status', employment_status);
    }

    if (search) {
      q = q.where((b) => {
        b.where('employees.first_name', 'like', `%${search}%`)
          .orWhere('employees.last_name', 'like', `%${search}%`)
          .orWhere('employees.email', 'like', `%${search}%`)
          .orWhere('employees.employee_code', 'like', `%${search}%`);
      });
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
   * Get direct reports for a manager
   * @param {number|string} managerId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getDirectReports(managerId, trx = null) {
    return await this.query(trx)
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .where('employees.manager_id', managerId)
      .select('employees.*', 'job_positions.title as job_position_title');
  }
}

export default new EmployeeModel();
