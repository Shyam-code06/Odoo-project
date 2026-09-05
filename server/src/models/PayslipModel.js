import BaseModel from './BaseModel.js';

export class PayslipModel extends BaseModel {
  constructor() {
    super('payslips', 'id');
  }

  /**
   * Get full payslip with employee details, structure, and all salary computation lines
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getFullPayslip(id, trx = null) {
    const payslip = await this.query(trx)
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('contracts', 'payslips.contract_id', 'contracts.id')
      .leftJoin('salary_structures', 'payslips.salary_structure_id', 'salary_structures.id')
      .leftJoin('payruns', 'payslips.payrun_id', 'payruns.id')
      .where('payslips.id', id)
      .select(
        'payslips.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'departments.name as department_name',
        'job_positions.title as job_title',
        'contracts.contract_number',
        'contracts.wage as base_wage',
        'salary_structures.name as structure_name',
        'payruns.name as payrun_name'
      )
      .first();

    if (!payslip) return null;

    const lines = await (trx ? trx('payslip_lines') : this.db('payslip_lines'))
      .where({ payslip_id: id })
      .orderBy('sequence', 'asc');

    return {
      ...payslip,
      lines,
    };
  }

  /**
   * Create payslip with all its lines within a database transaction
   * @param {object} payslipData
   * @param {object[]} linesData
   */
  async createWithLines(payslipData, linesData) {
    return await this.transaction(async (trx) => {
      const [payslipId] = await trx('payslips').insert(payslipData);
      
      if (linesData && linesData.length > 0) {
        const mappedLines = linesData.map((line) => ({
          ...line,
          payslip_id: payslipId,
        }));
        await trx('payslip_lines').insert(mappedLines);
      }

      return await this.getFullPayslip(payslipId, trx);
    });
  }
}

export default new PayslipModel();
