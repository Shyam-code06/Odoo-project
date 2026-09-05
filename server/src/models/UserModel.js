import BaseModel from './BaseModel.js';
import { getPermissionsForRole } from '../config/rbacConstants.js';

export class UserModel extends BaseModel {
  constructor() {
    super('users', 'id');
  }

  /**
   * Find user by email with role details
   * @param {string} email
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByEmail(email, trx = null) {
    const user = await this.query(trx)
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .where('users.email', email)
      .select(
        'users.*',
        'roles.name as role_name',
        this.db.raw("UPPER(REPLACE(roles.name, ' ', '_')) as role_code"),
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code'
      )
      .first();

    return user;
  }

  /**
   * Find user by ID with joined role, employee profile, and in-memory permissions
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findProfileById(id, trx = null) {
    const user = await this.query(trx)
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .where('users.id', id)
      .select(
        'users.id',
        'users.employee_id',
        'users.email',
        'users.role_id',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'roles.name as role_name',
        this.db.raw("UPPER(REPLACE(roles.name, ' ', '_')) as role_code"),
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'departments.name as department_name',
        'job_positions.title as job_title'
      )
      .first();

    if (!user) return null;

    // Attach in-memory permissions based on role code or name
    user.permissions = getPermissionsForRole(user.role_code || user.role_name);

    return user;
  }

  /**
   * Get all users with associated employee and role info
   * @param {object} [filter={}]
   * @param {object} [options={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getUsersWithDetails(filter = {}, options = {}, trx = null) {
    const { page, limit, search } = options;
    let q = this.query(trx)
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .select(
        'users.id',
        'users.employee_id',
        'users.email',
        'users.role_id',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'roles.name as role_name',
        this.db.raw("UPPER(REPLACE(roles.name, ' ', '_')) as role_code"),
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name'
      );

    if (search) {
      q = q.where((builder) => {
        builder
          .where('users.email', 'like', `%${search}%`)
          .orWhere('employees.first_name', 'like', `%${search}%`)
          .orWhere('employees.last_name', 'like', `%${search}%`)
          .orWhere('employees.employee_code', 'like', `%${search}%`);
      });
    }

    if (filter && Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    if (page && limit) {
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      q = q.limit(parseInt(limit, 10)).offset(offset);
    } else if (limit) {
      q = q.limit(parseInt(limit, 10));
    }

    return await q.orderBy('users.id', 'desc');
  }
}

export default new UserModel();
