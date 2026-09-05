import BaseModel from './BaseModel.js';

export class PayslipLineModel extends BaseModel {
  constructor() {
    super('payslip_lines', 'id');
  }

  /**
   * Find lines for a given payslip
   * @param {number|string} payslipId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByPayslipId(payslipId, trx = null) {
    return await this.findAll({ payslip_id: payslipId }, { orderBy: 'sequence', orderDir: 'asc' }, trx);
  }
}

export default new PayslipLineModel();
