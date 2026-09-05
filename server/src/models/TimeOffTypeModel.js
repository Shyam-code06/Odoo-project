import BaseModel from './BaseModel.js';

export class TimeOffTypeModel extends BaseModel {
  constructor() {
    super('time_off_types', 'id');
  }

  /**
   * Find time off type by code
   * @param {string} code
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByCode(code, trx = null) {
    return await this.findOne({ code }, ['*'], trx);
  }
}

export default new TimeOffTypeModel();
