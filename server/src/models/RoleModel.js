import BaseModel from './BaseModel.js';
import { getPermissionsForRole } from '../config/rbacConstants.js';

export class RoleModel extends BaseModel {
  constructor() {
    super('roles', 'id');
  }

  /**
   * Find role by code (e.g. 'ADMIN', 'HR_MANAGER', 'EMPLOYEE')
   * @param {string} code
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(code, trx = null) {
    return await this.findOne({ code }, ['*'], trx);
  }

  /**
   * Find role by name (e.g. 'Admin', 'HR Manager')
   * @param {string} name
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByName(name, trx = null) {
    return await this.findOne({ name }, ['*'], trx);
  }

  /**
   * Get role by ID along with its associated in-memory permission codes
   * @param {number|string} roleId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getRoleWithPermissions(roleId, trx = null) {
    const role = await this.findById(roleId, ['*'], trx);
    if (!role) return null;

    const permissions = getPermissionsForRole(role.code || role.name);

    return {
      ...role,
      permissions
    };
  }

  /**
   * Get roles with user counts
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getRolesWithUserCount(trx = null) {
    return await this.query(trx)
      .leftJoin('users', 'roles.id', 'users.role_id')
      .select('roles.*')
      .count('users.id as user_count')
      .groupBy('roles.id');
  }
}

export default new RoleModel();
