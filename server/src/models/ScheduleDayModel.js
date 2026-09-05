import BaseModel from './BaseModel.js';

export class ScheduleDayModel extends BaseModel {
  constructor() {
    super('schedule_days', 'id');
  }

  /**
   * Find days for a given schedule
   * @param {number|string} scheduleId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByScheduleId(scheduleId, trx = null) {
    return await this.findAll({ schedule_id: scheduleId }, { orderBy: 'id', orderDir: 'asc' }, trx);
  }
}

export default new ScheduleDayModel();
