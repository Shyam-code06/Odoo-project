import { db } from '../models/index.js';

export class DashboardService {
  /**
   * Helper: Get current month start and end dates in YYYY-MM-DD format
   */
  getDefaultDateRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();
    return {
      date_from: `${year}-${month}-01`,
      date_to: `${year}-${month}-${String(lastDay).padStart(2, '0')}`
    };
  }

  /**
   * Get Main Dashboard Summary & Live Metrics
   *
   * @param {object} filters
   * @param {object} user - Authenticated user
   */
  async getDashboardSummary(filters = {}, user) {
    const defaults = this.getDefaultDateRange();
    const dateFrom = filters.date_from || defaults.date_from;
    const dateTo = filters.date_to || defaults.date_to;
    const departmentId = filters.department_id ? Number(filters.department_id) : null;

    // 1. Employee Headcount Metrics
    let empQuery = db('employees');
    if (departmentId) {
      empQuery = empQuery.where('department_id', departmentId);
    }

    const headcount = await empQuery
      .select(
        db.raw('COUNT(id) as total_employees'),
        db.raw("SUM(CASE WHEN employment_status = 'active' THEN 1 ELSE 0 END) as active_employees"),
        db.raw("SUM(CASE WHEN employment_status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees"),
        db.raw("SUM(CASE WHEN employment_status = 'terminated' THEN 1 ELSE 0 END) as terminated_employees"),
        db.raw("SUM(CASE WHEN employment_status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_employees")
      )
      .first();

    // 2. Department Headcount Distribution
    const deptDistribution = await db('employees')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .where('employees.employment_status', 'active')
      .groupBy('departments.id', 'departments.name')
      .select(
        db.raw("COALESCE(departments.name, 'Unassigned') as department_name"),
        db.raw('COUNT(employees.id) as employee_count')
      )
      .orderBy('employee_count', 'desc');

    // 3. Attendance Analytics in Date Range
    let attQuery = db('attendance')
      .leftJoin('employees', 'attendance.employee_id', 'employees.id')
      .where('attendance.attendance_date', '>=', dateFrom)
      .where('attendance.attendance_date', '<=', dateTo);

    if (departmentId) {
      attQuery = attQuery.where('employees.department_id', departmentId);
    }

    const attSummary = await attQuery
      .select(
        db.raw('COUNT(attendance.id) as total_attendance_records'),
        db.raw("SUM(CASE WHEN attendance.status = 'present' THEN 1 ELSE 0 END) as present_count"),
        db.raw("SUM(CASE WHEN attendance.status = 'late' THEN 1 ELSE 0 END) as late_count"),
        db.raw("SUM(CASE WHEN attendance.status = 'half_day' THEN 1 ELSE 0 END) as half_day_count"),
        db.raw("SUM(CASE WHEN attendance.status = 'absent' THEN 1 ELSE 0 END) as absent_count"),
        db.raw('SUM(attendance.worked_minutes) as total_worked_minutes')
      )
      .first();

    const totalAttendancePunches = parseInt(attSummary?.total_attendance_records, 10) || 0;
    const presentCount = parseInt(attSummary?.present_count, 10) || 0;
    const lateCount = parseInt(attSummary?.late_count, 10) || 0;
    const halfDayCount = parseInt(attSummary?.half_day_count, 10) || 0;
    const absentCount = parseInt(attSummary?.absent_count, 10) || 0;
    const totalMinutes = parseInt(attSummary?.total_worked_minutes, 10) || 0;

    const onTimeRate =
      totalAttendancePunches > 0
        ? Number(((presentCount / totalAttendancePunches) * 100).toFixed(1))
        : 100.0;

    // 4. Time-Off / Leave Analytics
    let leaveQuery = db('time_off_requests')
      .leftJoin('employees', 'time_off_requests.employee_id', 'employees.id')
      .leftJoin('time_off_types', 'time_off_requests.time_off_type_id', 'time_off_types.id');

    if (departmentId) {
      leaveQuery = leaveQuery.where('employees.department_id', departmentId);
    }

    const pendingLeaves = await db('time_off_requests')
      .where({ status: 'pending' })
      .count('id as count')
      .first();

    const approvedLeaves = await leaveQuery
      .clone()
      .where('time_off_requests.status', 'approved')
      .where('time_off_requests.start_date', '<=', dateTo)
      .where('time_off_requests.end_date', '>=', dateFrom)
      .select(
        db.raw('COUNT(time_off_requests.id) as approved_count'),
        db.raw('SUM(time_off_requests.duration) as total_duration_days')
      )
      .first();

    const leaveTypeBreakdown = await leaveQuery
      .clone()
      .where('time_off_requests.status', 'approved')
      .groupBy('time_off_types.id', 'time_off_types.name', 'time_off_types.code')
      .select(
        'time_off_types.name as leave_type_name',
        'time_off_types.code as leave_type_code',
        db.raw('SUM(time_off_requests.duration) as total_days_taken'),
        db.raw('COUNT(time_off_requests.id) as request_count')
      );

    // 5. Payroll Expenditure & Recent Payrun Analytics
    const recentPayrun = await db('payruns')
      .leftJoin('salary_structures', 'payruns.salary_structure_id', 'salary_structures.id')
      .select(
        'payruns.*',
        'salary_structures.name as salary_structure_name'
      )
      .orderBy('payruns.id', 'desc')
      .first();

    let payslipQuery = db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id');

    if (departmentId) {
      payslipQuery = payslipQuery.where('employees.department_id', departmentId);
    }

    const payrollExpenditure = await payslipQuery
      .select(
        db.raw('COUNT(payslips.id) as total_payslips_issued'),
        db.raw('SUM(payslips.gross_salary) as total_gross_expenditure'),
        db.raw('SUM(payslips.total_deductions) as total_deductions_collected'),
        db.raw('SUM(payslips.net_salary) as total_net_disbursed'),
        db.raw('AVG(payslips.gross_salary) as average_gross_salary')
      )
      .first();

    // 6. Salary Trends Over Time (Last 6 Months)
    const salaryTrends = await db('payslips')
      .groupBy(db.raw("DATE_FORMAT(period_start, '%Y-%m')"))
      .select(
        db.raw("DATE_FORMAT(period_start, '%Y-%m') as month_period"),
        db.raw('COUNT(id) as payslip_count'),
        db.raw('SUM(gross_salary) as total_gross'),
        db.raw('SUM(net_salary) as total_net'),
        db.raw('SUM(total_deductions) as total_deductions')
      )
      .orderBy('month_period', 'asc')
      .limit(12);

    // 7. Department-wise Salary Expenditure
    const deptSalaryExpenditure = await db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .groupBy('departments.id', 'departments.name')
      .select(
        db.raw("COALESCE(departments.name, 'Unassigned') as department_name"),
        db.raw('COUNT(payslips.id) as payslip_count'),
        db.raw('SUM(payslips.gross_salary) as total_gross'),
        db.raw('SUM(payslips.net_salary) as total_net')
      )
      .orderBy('total_gross', 'desc');

    // 8. Operational Alerts
    const alerts = await this.getOperationalAlerts();

    return {
      period: { date_from: dateFrom, date_to: dateTo },
      headcount: {
        total: parseInt(headcount?.total_employees, 10) || 0,
        active: parseInt(headcount?.active_employees, 10) || 0,
        inactive: parseInt(headcount?.inactive_employees, 10) || 0,
        terminated: parseInt(headcount?.terminated_employees, 10) || 0,
        on_leave: parseInt(headcount?.on_leave_employees, 10) || 0
      },
      department_distribution: deptDistribution.map((d) => ({
        department_name: d.department_name,
        employee_count: parseInt(d.employee_count, 10) || 0
      })),
      attendance_summary: {
        total_records: totalAttendancePunches,
        present: presentCount,
        late: lateCount,
        half_day: halfDayCount,
        absent: absentCount,
        total_worked_hours: Number((totalMinutes / 60).toFixed(1)),
        on_time_rate_percent: onTimeRate
      },
      time_off_summary: {
        pending_requests: parseInt(pendingLeaves?.count, 10) || 0,
        approved_requests_period: parseInt(approvedLeaves?.approved_count, 10) || 0,
        total_days_taken_period: Number(approvedLeaves?.total_duration_days || 0),
        breakdown_by_type: leaveTypeBreakdown.map((l) => ({
          name: l.leave_type_name,
          code: l.leave_type_code,
          days: Number(l.total_days_taken || 0),
          requests_count: parseInt(l.request_count, 10) || 0
        }))
      },
      payroll_summary: {
        recent_payrun: recentPayrun
          ? {
              id: recentPayrun.id,
              name: recentPayrun.name,
              status: recentPayrun.status,
              period_start: recentPayrun.period_start,
              period_end: recentPayrun.period_end,
              salary_structure_name: recentPayrun.salary_structure_name
            }
          : null,
        total_payslips_issued: parseInt(payrollExpenditure?.total_payslips_issued, 10) || 0,
        total_gross_expenditure: Number(payrollExpenditure?.total_gross_expenditure || 0),
        total_deductions_collected: Number(payrollExpenditure?.total_deductions_collected || 0),
        total_net_disbursed: Number(payrollExpenditure?.total_net_disbursed || 0),
        average_gross_salary: Number(Number(payrollExpenditure?.average_gross_salary || 0).toFixed(2))
      },
      salary_trends: salaryTrends.map((t) => ({
        month: t.month_period,
        payslip_count: parseInt(t.payslip_count, 10) || 0,
        gross: Number(t.total_gross || 0),
        net: Number(t.total_net || 0),
        deductions: Number(t.total_deductions || 0)
      })),
      department_salary_expenditure: deptSalaryExpenditure.map((d) => ({
        department_name: d.department_name,
        payslip_count: parseInt(d.payslip_count, 10) || 0,
        gross: Number(d.total_gross || 0),
        net: Number(d.total_net || 0)
      })),
      operational_alerts: alerts
    };
  }

  /**
   * Helper: Get Operational HR & Payroll Alerts
   */
  async getOperationalAlerts() {
    const alerts = [];

    // 1. Pending Time-Off Requests
    const pendingLeaves = await db('time_off_requests')
      .leftJoin('employees', 'time_off_requests.employee_id', 'employees.id')
      .where('time_off_requests.status', 'pending')
      .select('time_off_requests.id', 'employees.first_name', 'employees.last_name', 'time_off_requests.start_date', 'time_off_requests.duration')
      .limit(5);

    if (pendingLeaves.length > 0) {
      alerts.push({
        type: 'WARNING',
        category: 'TIME_OFF',
        title: `${pendingLeaves.length} Pending Leave Request(s)`,
        message: `${pendingLeaves.length} employee leave request(s) awaiting approval`,
        count: pendingLeaves.length,
        items: pendingLeaves.map((l) => `${l.first_name} ${l.last_name} (${l.duration} days starting ${l.start_date})`)
      });
    }

    // 2. Payruns in Draft or with Computation Errors
    const pendingPayruns = await db('payruns')
      .whereIn('status', ['draft', 'computed'])
      .select('id', 'name', 'status', 'period_start', 'period_end');

    if (pendingPayruns.length > 0) {
      alerts.push({
        type: 'INFO',
        category: 'PAYROLL',
        title: `${pendingPayruns.length} Active Payrun(s) in Progress`,
        message: 'Payruns require computation or manager validation',
        count: pendingPayruns.length,
        items: pendingPayruns.map((p) => `${p.name} [Status: ${p.status.toUpperCase()}]`)
      });
    }

    // 3. Active Contracts Expiring within 30 days
    const expiringContracts = await db('contracts')
      .leftJoin('employees', 'contracts.employee_id', 'employees.id')
      .where('contracts.status', 'active')
      .whereNotNull('contracts.end_date')
      .where('contracts.end_date', '>=', db.fn.now())
      .where('contracts.end_date', '<=', db.raw('DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY)'))
      .select('contracts.id', 'contracts.contract_number', 'contracts.end_date', 'employees.first_name', 'employees.last_name')
      .limit(5);

    if (expiringContracts.length > 0) {
      alerts.push({
        type: 'WARNING',
        category: 'CONTRACTS',
        title: `${expiringContracts.length} Contract(s) Expiring Soon`,
        message: `${expiringContracts.length} employment contract(s) expiring within the next 30 days`,
        count: expiringContracts.length,
        items: expiringContracts.map((c) => `${c.first_name} ${c.last_name} (${c.contract_number} on ${c.end_date})`)
      });
    }

    return alerts;
  }

  /**
   * Employee Self-Service Dashboard
   *
   * @param {number|string} employeeId
   */
  async getEmployeeDashboard(employeeId) {
    const employee = await db('employees')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .where('employees.id', employeeId)
      .select(
        'employees.*',
        'departments.name as department_name',
        'job_positions.title as job_title'
      )
      .first();

    if (!employee) {
      const error = new Error(`Employee with ID ${employeeId} not found`);
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const defaults = this.getDefaultDateRange();

    // 1. Current Month Attendance Summary
    const attendanceRecords = await db('attendance')
      .where('employee_id', employeeId)
      .where('attendance_date', '>=', defaults.date_from)
      .where('attendance_date', '<=', defaults.date_to);

    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let totalMinutes = 0;

    for (const a of attendanceRecords) {
      totalMinutes += Number(a.worked_minutes || 0);
      const st = (a.status || '').toLowerCase();
      if (st === 'present') presentDays++;
      else if (st === 'late') lateDays++;
      else if (st === 'half_day') halfDays++;
      else if (st === 'absent') absentDays++;
    }

    // 2. Leave Balance Summary
    const allocations = await db('time_off_allocations')
      .leftJoin('time_off_types', 'time_off_allocations.time_off_type_id', 'time_off_types.id')
      .where('time_off_allocations.employee_id', employeeId)
      .where('time_off_allocations.status', 'approved')
      .select(
        'time_off_allocations.id',
        'time_off_types.name as leave_type_name',
        'time_off_types.code as leave_type_code',
        'time_off_allocations.allocated_amount',
        'time_off_allocations.used_amount'
      );

    const leaveBalances = allocations.map((a) => {
      const allocated = Number(a.allocated_amount || 0);
      const used = Number(a.used_amount || 0);
      return {
        id: a.id,
        leave_type_name: a.leave_type_name,
        leave_type_code: a.leave_type_code,
        allocated_amount: allocated,
        used_amount: used,
        available_balance: Math.max(0, allocated - used)
      };
    });

    // 3. Recent Payslips & YTD Earnings
    const recentPayslips = await db('payslips')
      .where('employee_id', employeeId)
      .orderBy('period_start', 'desc')
      .limit(6);

    const ytdTotals = await db('payslips')
      .where('employee_id', employeeId)
      .select(
        db.raw('SUM(gross_salary) as ytd_gross'),
        db.raw('SUM(net_salary) as ytd_net'),
        db.raw('SUM(total_deductions) as ytd_deductions')
      )
      .first();

    // 4. Active Contract
    const activeContract = await db('contracts')
      .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
      .where({ employee_id: employeeId, status: 'active' })
      .select('contracts.*', 'salary_structures.name as salary_structure_name')
      .first();

    return {
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        department_name: employee.department_name,
        job_title: employee.job_title
      },
      current_month_attendance: {
        period: defaults,
        present_days: presentDays,
        late_days: lateDays,
        half_days: halfDays,
        absent_days: absentDays,
        total_worked_hours: Number((totalMinutes / 60).toFixed(1))
      },
      leave_balances: leaveBalances,
      recent_payslips: recentPayslips.map((p) => ({
        id: p.id,
        period_start: p.period_start,
        period_end: p.period_end,
        gross_salary: Number(p.gross_salary),
        total_deductions: Number(p.total_deductions),
        net_salary: Number(p.net_salary),
        status: p.status
      })),
      ytd_earnings: {
        gross: Number(ytdTotals?.ytd_gross || 0),
        net: Number(ytdTotals?.ytd_net || 0),
        deductions: Number(ytdTotals?.ytd_deductions || 0)
      },
      active_contract: activeContract
        ? {
            contract_number: activeContract.contract_number,
            wage: Number(activeContract.wage),
            employment_type: activeContract.employment_type,
            salary_structure_name: activeContract.salary_structure_name
          }
        : null
    };
  }

  /**
   * Report 1: Employee Headcount & Demographics Report
   *
   * @param {object} filters
   */
  async getEmployeeReport(filters = {}) {
    let query = db('employees')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('contracts', function () {
        this.on('employees.id', '=', 'contracts.employee_id').andOn('contracts.status', '=', db.raw("'active'"));
      });

    if (filters.department_id) {
      query = query.where('employees.department_id', filters.department_id);
    }
    if (filters.status) {
      query = query.where('employees.employment_status', filters.status.toLowerCase());
    }

    const employees = await query
      .select(
        'employees.id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'employees.email',
        'employees.phone',
        'employees.joining_date',
        'employees.employment_status',
        'departments.name as department_name',
        'job_positions.title as job_title',
        'contracts.wage as current_wage',
        'contracts.employment_type'
      )
      .orderBy('employees.id', 'asc');

    const totalCount = employees.length;
    const activeCount = employees.filter((e) => e.employment_status === 'active').length;

    return {
      summary: {
        total_count: totalCount,
        active_count: activeCount,
        inactive_count: totalCount - activeCount
      },
      data: employees.map((e) => ({
        ...e,
        current_wage: e.current_wage ? Number(e.current_wage) : null
      }))
    };
  }

  /**
   * Report 2: Attendance Report
   *
   * @param {object} filters
   */
  async getAttendanceReport(filters = {}) {
    const defaults = this.getDefaultDateRange();
    const dateFrom = filters.date_from || defaults.date_from;
    const dateTo = filters.date_to || defaults.date_to;

    let query = db('attendance')
      .leftJoin('employees', 'attendance.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .where('attendance.attendance_date', '>=', dateFrom)
      .where('attendance.attendance_date', '<=', dateTo);

    if (filters.department_id) {
      query = query.where('employees.department_id', filters.department_id);
    }
    if (filters.employee_id) {
      query = query.where('attendance.employee_id', filters.employee_id);
    }

    const rows = await query
      .groupBy(
        'employees.id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'departments.name'
      )
      .select(
        'employees.id as employee_id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'departments.name as department_name',
        db.raw('COUNT(attendance.id) as total_punches'),
        db.raw("SUM(CASE WHEN attendance.status = 'present' THEN 1 ELSE 0 END) as present_days"),
        db.raw("SUM(CASE WHEN attendance.status = 'late' THEN 1 ELSE 0 END) as late_days"),
        db.raw("SUM(CASE WHEN attendance.status = 'half_day' THEN 1 ELSE 0 END) as half_days"),
        db.raw("SUM(CASE WHEN attendance.status = 'absent' THEN 1 ELSE 0 END) as absent_days"),
        db.raw('SUM(attendance.worked_minutes) as total_worked_minutes')
      )
      .orderBy('employees.id', 'asc');

    const formattedData = rows.map((r) => {
      const total = parseInt(r.total_punches, 10) || 0;
      const present = parseInt(r.present_days, 10) || 0;
      const late = parseInt(r.late_days, 10) || 0;
      const half = parseInt(r.half_days, 10) || 0;
      const absent = parseInt(r.absent_days, 10) || 0;
      const minutes = parseInt(r.total_worked_minutes, 10) || 0;

      return {
        employee_id: r.employee_id,
        employee_code: r.employee_code,
        employee_name: `${r.first_name} ${r.last_name}`,
        department_name: r.department_name || 'General',
        total_days_recorded: total,
        present_days: present,
        late_days: late,
        half_days: half,
        absent_days: absent,
        total_worked_hours: Number((minutes / 60).toFixed(2)),
        on_time_rate_percent: total > 0 ? Number(((present / total) * 100).toFixed(1)) : 100.0
      };
    });

    return {
      period: { date_from: dateFrom, date_to: dateTo },
      total_employees_reported: formattedData.length,
      data: formattedData
    };
  }

  /**
   * Report 3: Time-Off / Leave Utilization Report
   *
   * @param {object} filters
   */
  async getTimeOffReport(filters = {}) {
    const defaults = this.getDefaultDateRange();
    const dateFrom = filters.date_from || defaults.date_from;
    const dateTo = filters.date_to || defaults.date_to;

    let query = db('time_off_requests')
      .leftJoin('employees', 'time_off_requests.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('time_off_types', 'time_off_requests.time_off_type_id', 'time_off_types.id')
      .where('time_off_requests.start_date', '<=', dateTo)
      .where('time_off_requests.end_date', '>=', dateFrom);

    if (filters.department_id) {
      query = query.where('employees.department_id', filters.department_id);
    }
    if (filters.employee_id) {
      query = query.where('time_off_requests.employee_id', filters.employee_id);
    }
    if (filters.status) {
      query = query.where('time_off_requests.status', filters.status.toLowerCase());
    }

    const requests = await query
      .select(
        'time_off_requests.id',
        'time_off_requests.employee_id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'departments.name as department_name',
        'time_off_types.name as leave_type_name',
        'time_off_types.code as leave_type_code',
        'time_off_types.is_paid',
        'time_off_requests.start_date',
        'time_off_requests.end_date',
        'time_off_requests.duration',
        'time_off_requests.status',
        'time_off_requests.reason'
      )
      .orderBy('time_off_requests.start_date', 'desc');

    const totalDays = requests.reduce((sum, r) => sum + Number(r.duration || 0), 0);

    return {
      period: { date_from: dateFrom, date_to: dateTo },
      summary: {
        total_requests: requests.length,
        total_leave_days: Number(totalDays.toFixed(1)),
        approved_count: requests.filter((r) => r.status === 'approved').length,
        pending_count: requests.filter((r) => r.status === 'pending').length,
        rejected_count: requests.filter((r) => r.status === 'rejected').length
      },
      data: requests.map((r) => ({
        ...r,
        duration: Number(r.duration)
      }))
    };
  }

  /**
   * Report 4: Payroll & Salary Expenditure Report
   *
   * @param {object} filters
   */
  async getPayrollReport(filters = {}) {
    let query = db('payslips')
      .leftJoin('employees', 'payslips.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('payruns', 'payslips.payrun_id', 'payruns.id')
      .leftJoin('salary_structures', 'payslips.salary_structure_id', 'salary_structures.id');

    if (filters.date_from) {
      query = query.where('payslips.period_start', '>=', filters.date_from);
    }
    if (filters.date_to) {
      query = query.where('payslips.period_end', '<=', filters.date_to);
    }
    if (filters.department_id) {
      query = query.where('employees.department_id', filters.department_id);
    }
    if (filters.employee_id) {
      query = query.where('payslips.employee_id', filters.employee_id);
    }

    const payslips = await query
      .select(
        'payslips.id',
        'payslips.employee_id',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'departments.name as department_name',
        'payruns.name as payrun_name',
        'salary_structures.name as salary_structure_name',
        'payslips.period_start',
        'payslips.period_end',
        'payslips.gross_salary',
        'payslips.total_deductions',
        'payslips.net_salary',
        'payslips.status'
      )
      .orderBy('payslips.id', 'desc');

    const totalGross = payslips.reduce((sum, p) => sum + Number(p.gross_salary), 0);
    const totalDeductions = payslips.reduce((sum, p) => sum + Number(p.total_deductions), 0);
    const totalNet = payslips.reduce((sum, p) => sum + Number(p.net_salary), 0);

    return {
      summary: {
        total_payslips: payslips.length,
        total_gross_expenditure: Number(totalGross.toFixed(2)),
        total_deductions_collected: Number(totalDeductions.toFixed(2)),
        total_net_disbursed: Number(totalNet.toFixed(2)),
        average_salary: payslips.length > 0 ? Number((totalGross / payslips.length).toFixed(2)) : 0
      },
      data: payslips.map((p) => ({
        ...p,
        gross_salary: Number(p.gross_salary),
        total_deductions: Number(p.total_deductions),
        net_salary: Number(p.net_salary)
      }))
    };
  }
}

export default new DashboardService();
