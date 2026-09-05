import BaseModel from './BaseModel.js';

export class WorkingScheduleModel extends BaseModel {
  constructor() {
    super('working_schedules', 'id');
  }

  /**
   * Get schedule by ID with all day records
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getScheduleWithDays(id, trx = null) {
    const schedule = await this.findById(id, ['*'], trx);
    if (!schedule) return null;

    const days = await (trx ? trx('schedule_days') : this.db('schedule_days'))
      .where({ schedule_id: id })
      .orderBy('id', 'asc');

    return {
      ...schedule,
      days,
    };
  }
}

export default new WorkingScheduleModel();
