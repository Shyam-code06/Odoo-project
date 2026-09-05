import {
  db,
  PayslipModel,
  PayslipLineModel,
  PayrunModel,
  EmployeeModel,
  ContractModel
} from '../models/index.js';
import payrollCalculationService from './payrollCalculationService.js';
import { sendPayslipEmail as sendMail } from '../utils/mailer.js';

export class PayslipService {
  /**
   * Generate payslips and line breakdown items for all computed employees in a Payrun
   *
   * @param {number|string} payrunId
   */
  async generatePayslipsForPayrun(payrunId) {
    const payrun = await PayrunModel.findById(payrunId);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrunId} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (['draft', 'cancelled'].includes(payrun.status)) {
      const error = new Error(
        `Cannot generate payslips for a payrun with status '${payrun.status}' (payrun must be computed or validated)`
      );
      error.statusCode = 400;
      error.code = 'INVALID_PAYRUN_STATUS';
      throw error;
    }

    // Fetch successfully computed/paid employees for this payrun
    const payrunEmployees = await db('payrun_employees')
      .leftJoin('employees', 'payrun_employees.employee_id', 'employees.id')
      .where('payrun_employees.payrun_id', payrunId)
      .whereIn('payrun_employees.status', ['computed', 'paid'])
      .select('payrun_employees.*', 'employees.first_name', 'employees.last_name', 'employees.employee_code');

    if (payrunEmployees.length === 0) {
      const error = new Error('No computed employees found in this payrun to generate payslips for');
      error.statusCode = 400;
      error.code = 'NO_COMPUTED_EMPLOYEES';
      throw error;
    }

    // Perform snapshot calculations and persist in database transaction
    const createdPayslips = [];

    await db.transaction(async (trx) => {
      // Clean up previous payslips for this payrun to avoid duplicates
      const existingPayslips = await trx('payslips').where({ payrun_id: payrunId }).select('id');
      if (existingPayslips.length > 0) {
        const existingIds = existingPayslips.map((p) => p.id);
        await trx('payslip_lines').whereIn('payslip_id', existingIds).del();
        await trx('payslips').where({ payrun_id: payrunId }).del();
      }

      for (const pe of payrunEmployees) {
        const calculation = await payrollCalculationService.calculateEmployeePayroll({
          employee_id: pe.employee_id,
          period_start: payrun.period_start,
          period_end: payrun.period_end,
          salary_structure_id: payrun.salary_structure_id,
          contract_id: pe.contract_id
        });

        const [payslipId] = await trx('payslips').insert({
          payrun_id: payrunId,
          employee_id: pe.employee_id,
          contract_id: pe.contract_id,
          salary_structure_id: calculation.salary_structure.id,
          period_start: payrun.period_start,
          period_end: payrun.period_end,
          gross_salary: calculation.gross_salary,
          total_deductions: calculation.total_deductions,
          net_salary: calculation.net_salary,
          status: payrun.status === 'paid' ? 'paid' : 'generated',
          pdf_path: null
        });

        const lineRows = calculation.rule_lines.map((rl) => ({
          payslip_id: payslipId,
          salary_rule_id: rl.rule_id,
          name: rl.name,
          code: rl.code,
          category: rl.category_code || rl.category_name || 'ALW',
          sequence: rl.sequence || 1,
          amount: rl.amount,
          quantity: rl.quantity || 1.0,
          rate: rl.rate || 100.0,
          calculation_details: JSON.stringify({
            details: rl.calculation_details,
            formula: rl.formula_expression,
            condition: rl.condition_expression,
            condition_met: rl.condition_met
          })
        }));

        if (lineRows.length > 0) {
          await trx('payslip_lines').insert(lineRows);
        }

        createdPayslips.push({
          id: payslipId,
          employee_id: pe.employee_id,
          employee_name: `${pe.first_name} ${pe.last_name}`,
          gross_salary: calculation.gross_salary,
          total_deductions: calculation.total_deductions,
          net_salary: calculation.net_salary
        });
      }
    });

    const totalGross = createdPayslips.reduce((sum, p) => sum + p.gross_salary, 0);
    const totalDeductions = createdPayslips.reduce((sum, p) => sum + p.total_deductions, 0);
    const totalNet = createdPayslips.reduce((sum, p) => sum + p.net_salary, 0);

    return {
      payrun_id: payrunId,
      payrun_name: payrun.name,
      generated_count: createdPayslips.length,
      summary_totals: {
        total_gross: Number(totalGross.toFixed(2)),
        total_deductions: Number(totalDeductions.toFixed(2)),
        total_net: Number(totalNet.toFixed(2))
      },
      payslips: createdPayslips
    };
  }

  /**
   * List payslips with filtering, search, pagination, and RBAC ownership scoping
   *
   * @param {object} params
   * @param {object} user - Authenticated user
   */
  async getPayslips(params = {}, user) {
    const isEmployee = (user.role_name || user.role_code || '').trim().toLowerCase() === 'employee';
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;

    let query = db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('payruns', 'payslips.payrun_id', 'payruns.id')
      .leftJoin('salary_structures', 'payslips.salary_structure_id', 'salary_structures.id');

    // Ownership scoping for normal employees
    if (isEmployee) {
      query = query.where('payslips.employee_id', user.employee_id);
    } else {
      if (params.employee_id) {
        query = query.where('payslips.employee_id', params.employee_id);
      }
      if (params.department_id) {
        query = query.where('employees.department_id', params.department_id);
      }
    }

    if (params.payrun_id) {
      query = query.where('payslips.payrun_id', params.payrun_id);
    }

    if (params.status) {
      query = query.where('payslips.status', params.status.trim().toLowerCase());
    }

    if (params.period_start) {
      query = query.where('payslips.period_start', '>=', params.period_start);
    }

    if (params.period_end) {
      query = query.where('payslips.period_end', '<=', params.period_end);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('employees.first_name', 'like', `%${search}%`)
          .orWhere('employees.last_name', 'like', `%${search}%`)
          .orWhere('employees.employee_code', 'like', `%${search}%`)
          .orWhere('payruns.name', 'like', `%${search}%`);
      });
    }

    const countResult = await query.clone().count('payslips.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await query
      .select(
        'payslips.*',
        'employees.first_name as employee_first_name',
        'employees.last_name as employee_last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'departments.name as department_name',
        'job_positions.title as job_title',
        'payruns.name as payrun_name',
        'salary_structures.name as structure_name'
      )
      .orderBy('payslips.id', 'desc')
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single full payslip by ID with all calculation line breakdown items
   *
   * @param {number|string} id
   * @param {object} user - Authenticated user
   */
  async getPayslipById(id, user) {
    const payslip = await db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('contracts', 'payslips.contract_id', 'contracts.id')
      .leftJoin('salary_structures', 'payslips.salary_structure_id', 'salary_structures.id')
      .leftJoin('payruns', 'payslips.payrun_id', 'payruns.id')
      .where('payslips.id', id)
      .select(
        'payslips.*',
        'employees.first_name as employee_first_name',
        'employees.last_name as employee_last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'employees.phone as employee_phone',
        'departments.name as department_name',
        'job_positions.title as job_title',
        'contracts.contract_number',
        'contracts.wage as base_wage',
        'contracts.employment_type',
        'salary_structures.name as structure_name',
        'salary_structures.code as structure_code',
        'payruns.name as payrun_name'
      )
      .first();

    if (!payslip) {
      const error = new Error(`Payslip with ID ${id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Ownership Enforcement for normal employees
    const isEmployee = (user.role_name || user.role_code || '').trim().toLowerCase() === 'employee';
    if (isEmployee && Number(payslip.employee_id) !== Number(user.employee_id)) {
      const error = new Error('Access denied: You are not authorized to view another employee\'s payslip');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const rawLines = await db('payslip_lines')
      .where({ payslip_id: id })
      .orderBy('sequence', 'asc')
      .orderBy('id', 'asc');

    const lines = rawLines.map((l) => {
      let parsedDetails = null;
      if (l.calculation_details) {
        try {
          parsedDetails = typeof l.calculation_details === 'string'
            ? JSON.parse(l.calculation_details)
            : l.calculation_details;
        } catch {
          parsedDetails = l.calculation_details;
        }
      }

      return {
        ...l,
        amount: Number(l.amount),
        quantity: Number(l.quantity),
        rate: Number(l.rate),
        calculation_details: parsedDetails
      };
    });

    const earningsLines = lines.filter((l) => {
      const cat = (l.category || '').toLowerCase();
      return cat === 'basic' || cat === 'alw' || cat === 'allowance';
    });

    const deductionLines = lines.filter((l) => {
      const cat = (l.category || '').toLowerCase();
      return cat === 'ded' || cat === 'deduction';
    });

    return {
      ...payslip,
      gross_salary: Number(payslip.gross_salary),
      total_deductions: Number(payslip.total_deductions),
      net_salary: Number(payslip.net_salary),
      base_wage: payslip.base_wage ? Number(payslip.base_wage) : null,
      summary_breakdown: {
        earnings: earningsLines,
        deductions: deductionLines
      },
      lines
    };
  }

  /**
   * Send an individual payslip email to the employee
   *
   * @param {number|string} id - Payslip ID
   * @param {object} payload - Optional pdf_base64 attachment
   * @param {object} user - Authenticated user
   */
  async sendSinglePayslipEmail(id, payload = {}, user) {
    const payslip = await this.getPayslipById(id, user);

    if (!payslip.employee_email) {
      const error = new Error(`Employee ${payslip.employee_first_name} ${payslip.employee_last_name} has no email address configured`);
      error.statusCode = 400;
      error.code = 'NO_EMPLOYEE_EMAIL';
      throw error;
    }

    const mailResult = await sendMail({
      to: payslip.employee_email,
      payslip,
      pdfBase64: payload.pdf_base64,
      pdfFilename: payload.pdf_filename
    });

    // Record email delivery time
    await db('payslips')
      .where({ id })
      .update({
        email_sent_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    return {
      success: true,
      message: `Payslip email sent successfully to ${payslip.employee_email}`,
      email_sent_at: new Date(),
      message_id: mailResult.messageId
    };
  }

  /**
   * Bulk-send payslips for all or selected employees in a Payrun
   *
   * @param {object} payload
   * @param {number|string} payload.payrun_id
   * @param {number[]} [payload.employee_ids]
   */
  async bulkSendPayrunPayslips(payload) {
    const { payrun_id, employee_ids } = payload;

    const payrun = await PayrunModel.findById(payrun_id);
    if (!payrun) {
      const error = new Error(`Payrun with ID ${payrun_id} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    let payslipQuery = db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .where('payslips.payrun_id', payrun_id)
      .select('payslips.id', 'payslips.employee_id', 'employees.email as employee_email', 'employees.first_name', 'employees.last_name');

    if (employee_ids && employee_ids.length > 0) {
      payslipQuery = payslipQuery.whereIn('payslips.employee_id', employee_ids);
    }

    const payslips = await payslipQuery;
    if (payslips.length === 0) {
      const error = new Error('No payslips found for this payrun to send emails');
      error.statusCode = 404;
      error.code = 'NO_PAYSLIPS_FOUND';
      throw error;
    }

    const successfulSends = [];
    const failedSends = [];

    for (const p of payslips) {
      try {
        if (!p.employee_email) {
          throw new Error('Employee has no email address configured');
        }

        const fullPayslip = await this.getPayslipById(p.id, { role_name: 'Admin' });
        await sendMail({
          to: p.employee_email,
          payslip: fullPayslip
        });

        await db('payslips')
          .where({ id: p.id })
          .update({
            email_sent_at: db.fn.now(),
            updated_at: db.fn.now()
          });

        successfulSends.push({
          payslip_id: p.id,
          employee_id: p.employee_id,
          employee_name: `${p.first_name} ${p.last_name}`,
          email: p.employee_email
        });
      } catch (err) {
        failedSends.push({
          payslip_id: p.id,
          employee_id: p.employee_id,
          employee_name: `${p.first_name} ${p.last_name}`,
          email: p.employee_email || 'N/A',
          error: err.message
        });
      }
    }

    return {
      payrun_id,
      total_processed: payslips.length,
      successful_count: successfulSends.length,
      failed_count: failedSends.length,
      successful_sends: successfulSends,
      failed_sends: failedSends
    };
  }
}

export default new PayslipService();
