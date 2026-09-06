import { db } from '../models/index.js';

/**
 * Payroll Analytics Service
 * Executes database-level aggregation queries for salary distribution and historical trends.
 */
export class PayrollAnalyticsService {
  /**
   * Finalized payroll statuses considered for authoritative reporting & analytics
   */
  getFinalizedStatuses() {
    return ['generated', 'validated', 'paid'];
  }

  /**
   * 1. Salary Cost by Department
   * Performs database-level aggregation grouping net salary cost by department
   *
   * @param {object} filters
   * @param {string} [filters.date_from] - Optional period start lower bound (YYYY-MM-DD)
   * @param {string} [filters.date_to] - Optional period end upper bound (YYYY-MM-DD)
   * @param {number|string} [filters.department_id] - Optional department filter
   * @param {string} [filters.status] - Optional payslip status filter
   */
  async getSalaryCostByDepartment(filters = {}) {
    let query = db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id');

    // Status filtering: default to finalized statuses
    if (filters.status) {
      query = query.where('payslips.status', filters.status.trim().toLowerCase());
    } else {
      query = query.whereIn('payslips.status', this.getFinalizedStatuses());
    }

    // Optional Date Range
    if (filters.date_from) {
      query = query.where('payslips.period_start', '>=', filters.date_from);
    }
    if (filters.date_to) {
      query = query.where('payslips.period_end', '<=', filters.date_to);
    }

    // Optional Department Filter
    if (filters.department_id) {
      query = query.where('employees.department_id', Number(filters.department_id));
    }

    const rows = await query
      .groupBy('departments.id', 'departments.name')
      .select(
        'departments.id as department_id',
        db.raw("COALESCE(departments.name, 'Unassigned') as department_name"),
        db.raw('COUNT(payslips.id) as payslip_count'),
        db.raw('COUNT(DISTINCT payslips.employee_id) as employee_count'),
        db.raw('COALESCE(SUM(payslips.gross_salary), 0) as gross_salary_cost'),
        db.raw('COALESCE(SUM(payslips.total_deductions), 0) as total_deductions'),
        db.raw('COALESCE(SUM(payslips.net_salary), 0) as net_salary_cost')
      )
      .orderBy('net_salary_cost', 'desc');

    const totalSalaryCost = rows.reduce((sum, r) => sum + Number(r.net_salary_cost || 0), 0);

    const formattedData = rows.map((r) => {
      const netCost = Number(Number(r.net_salary_cost || 0).toFixed(2));
      const percentageOfTotal = totalSalaryCost > 0
        ? Number(((netCost / totalSalaryCost) * 100).toFixed(1))
        : 0;

      return {
        departmentId: r.department_id || null,
        departmentName: r.department_name || 'Unassigned',
        salaryCost: netCost,
        grossSalary: Number(Number(r.gross_salary_cost || 0).toFixed(2)),
        totalDeductions: Number(Number(r.total_deductions || 0).toFixed(2)),
        employeeCount: parseInt(r.employee_count, 10) || 0,
        payslipCount: parseInt(r.payslip_count, 10) || 0,
        percentageOfTotal
      };
    });

    return {
      totalSalaryCost: Number(totalSalaryCost.toFixed(2)),
      totalDepartments: formattedData.length,
      data: formattedData
    };
  }

  /**
   * 2. Monthly Net Salary Trends
   * Aggregates historical monthly net payroll disbursements in chronological order
   *
   * @param {object} filters
   * @param {string} [filters.date_from] - Optional period start lower bound (YYYY-MM-DD)
   * @param {string} [filters.date_to] - Optional period end upper bound (YYYY-MM-DD)
   * @param {number|string} [filters.department_id] - Optional department filter
   * @param {string} [filters.status] - Optional payslip status filter
   */
  async getMonthlyNetSalaryTrends(filters = {}) {
    let query = db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id');

    // Status filtering: default to finalized statuses
    if (filters.status) {
      query = query.where('payslips.status', filters.status.trim().toLowerCase());
    } else {
      query = query.whereIn('payslips.status', this.getFinalizedStatuses());
    }

    // Optional Date Range
    if (filters.date_from) {
      query = query.where('payslips.period_start', '>=', filters.date_from);
    }
    if (filters.date_to) {
      query = query.where('payslips.period_end', '<=', filters.date_to);
    }

    // Optional Department Filter
    if (filters.department_id) {
      query = query.where('employees.department_id', Number(filters.department_id));
    }

    const rows = await query
      .groupBy(db.raw("DATE_FORMAT(payslips.period_start, '%Y-%m')"))
      .select(
        db.raw("DATE_FORMAT(payslips.period_start, '%Y-%m') as month"),
        db.raw('COUNT(payslips.id) as payslip_count'),
        db.raw('COUNT(DISTINCT payslips.employee_id) as employee_count'),
        db.raw('COALESCE(SUM(payslips.gross_salary), 0) as gross_salary'),
        db.raw('COALESCE(SUM(payslips.total_deductions), 0) as total_deductions'),
        db.raw('COALESCE(SUM(payslips.net_salary), 0) as net_salary')
      )
      .orderBy('month', 'asc');

    const formattedData = rows.map((r) => {
      // Month label formatting (e.g. '2026-08' -> 'Aug 2026')
      let monthLabel = r.month;
      if (r.month && r.month.includes('-')) {
        const [year, monthNum] = r.month.split('-');
        const dateObj = new Date(Number(year), Number(monthNum) - 1, 1);
        if (!isNaN(dateObj.getTime())) {
          monthLabel = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        }
      }

      return {
        month: r.month,
        monthLabel,
        netSalary: Number(Number(r.net_salary || 0).toFixed(2)),
        grossSalary: Number(Number(r.gross_salary || 0).toFixed(2)),
        totalDeductions: Number(Number(r.total_deductions || 0).toFixed(2)),
        employeeCount: parseInt(r.employee_count, 10) || 0,
        payslipCount: parseInt(r.payslip_count, 10) || 0
      };
    });

    const totalNetDisbursed = formattedData.reduce((sum, r) => sum + r.netSalary, 0);

    return {
      totalNetDisbursed: Number(totalNetDisbursed.toFixed(2)),
      totalMonths: formattedData.length,
      data: formattedData
    };
  }
}

export default new PayrollAnalyticsService();
