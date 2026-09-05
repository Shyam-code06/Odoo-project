import BaseModel from './BaseModel.js';

export class RoleModel extends BaseModel {
  constructor() {
    super('roles', 'id');
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
