import {
  db,
  EmployeeModel,
  ContractModel,
  SalaryStructureModel,
  SalaryRuleModel,
  SalaryRuleCategoryModel
} from '../models/index.js';
import contractService from './contractService.js';
import { evaluateFormula, evaluateCondition } from '../utils/safeFormulaEvaluator.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export class PayrollCalculationService {
  /**
   * Helper: Get all calendar days between start and end date (inclusive)
   */
  getDatesInRange(startDateStr, endDateStr) {
    const dates = [];
    const curr = new Date(startDateStr);
    const end = new Date(endDateStr);

    while (curr <= end) {
      const year = curr.getFullYear();
      const month = String(curr.getMonth() + 1).padStart(2, '0');
      const day = String(curr.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      curr.setDate(curr.getDate() + 1);
    }

    return dates;
  }

  /**
   * Helper: Calculate total scheduled working days and expected hours for a schedule
   */
  async getScheduleWorkingDays(scheduleId, periodStart, periodEnd) {
    const dates = this.getDatesInRange(periodStart, periodEnd);
    if (!scheduleId) {
      // Default: 5-day work week (Monday-Friday), 8 hours/day
      let scheduledDays = 0;
      for (const d of dates) {
        const dayIdx = new Date(d).getDay();
        if (dayIdx !== 0 && dayIdx !== 6) {
          scheduledDays++;
        }
      }
      return {
        scheduled_days: scheduledDays,
        scheduled_hours: scheduledDays * 8,
        total_calendar_days: dates.length
      };
    }

    const scheduleDays = await db('schedule_days').where({ schedule_id: scheduleId });
    const scheduleDayMap = {};
    for (const sd of scheduleDays) {
      const [sh, sm] = sd.start_time.split(':').map(Number);
      const [eh, em] = sd.end_time.split(':').map(Number);
      const grossMinutes = (eh * 60 + em) - (sh * 60 + sm);
      const netHours = Math.max(0, (grossMinutes - (sd.break_minutes || 0)) / 60);
      scheduleDayMap[sd.day_of_week] = netHours;
    }

    let scheduledDays = 0;
    let scheduledHours = 0;

    for (const d of dates) {
      const dayName = DAYS_OF_WEEK[new Date(d).getDay()];
      if (scheduleDayMap[dayName] !== undefined && scheduleDayMap[dayName] > 0) {
        scheduledDays++;
        scheduledHours += scheduleDayMap[dayName];
      }
    }

    return {
      scheduled_days: scheduledDays,
      scheduled_hours: Number(scheduledHours.toFixed(2)),
      total_calendar_days: dates.length
    };
  }

  /**
   * Helper: Aggregate attendance records for an employee within a period
   */
  async getAttendanceSummary(employeeId, periodStart, periodEnd) {
    const records = await db('attendance')
      .where('employee_id', employeeId)
      .where('attendance_date', '>=', periodStart)
      .where('attendance_date', '<=', periodEnd);

    let totalWorkedMinutes = 0;
    let presentDays = 0;
    let lateDays = 0;
    let halfDays = 0;
    let absentDays = 0;

    for (const rec of records) {
      totalWorkedMinutes += Number(rec.worked_minutes || 0);
      const st = (rec.status || '').toLowerCase();
      if (st === 'present') presentDays++;
      else if (st === 'late') lateDays++;
      else if (st === 'half_day') halfDays++;
      else if (st === 'absent') absentDays++;
    }

    const workedDays = presentDays + lateDays + (halfDays * 0.5);
    const workedHours = Number((totalWorkedMinutes / 60).toFixed(2));

    return {
      total_attendance_records: records.length,
      worked_minutes: totalWorkedMinutes,
      worked_hours: workedHours,
      present_days: presentDays,
      late_days: lateDays,
      half_days: halfDays,
      absent_days: absentDays,
      worked_days: workedDays
    };
  }

  /**
   * Helper: Aggregate approved time-off requests for an employee within a period
   */
  async getTimeOffSummary(employeeId, periodStart, periodEnd) {
    const approvedRequests = await db('time_off_requests')
      .leftJoin('time_off_types', 'time_off_requests.time_off_type_id', 'time_off_types.id')
      .where('time_off_requests.employee_id', employeeId)
      .where('time_off_requests.status', 'approved')
      .where('time_off_requests.start_date', '<=', periodEnd)
      .where('time_off_requests.end_date', '>=', periodStart)
      .select(
        'time_off_requests.*',
        'time_off_types.name as type_name',
        'time_off_types.code as type_code',
        'time_off_types.is_paid'
      );

    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;

    const periodStartDate = new Date(periodStart);
    const periodEndDate = new Date(periodEnd);

    for (const req of approvedRequests) {
      const reqStart = new Date(req.start_date);
      const reqEnd = new Date(req.end_date);

      // Overlap range
      const overlapStart = reqStart < periodStartDate ? periodStartDate : reqStart;
      const overlapEnd = reqEnd > periodEndDate ? periodEndDate : reqEnd;

      const diffTime = Math.abs(overlapEnd - overlapStart);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (req.is_paid) {
        paidLeaveDays += days;
      } else {
        unpaidLeaveDays += days;
      }
    }

    return {
      approved_requests_count: approvedRequests.length,
      paid_leave_days: paidLeaveDays,
      unpaid_leave_days: unpaidLeaveDays,
      total_leave_days: paidLeaveDays + unpaidLeaveDays
    };
  }

  /**
   * Calculate full payroll salary breakdown for an employee
   *
   * @param {object} params
   * @param {number|string} params.employee_id
   * @param {string} params.period_start - 'YYYY-MM-DD'
   * @param {string} params.period_end - 'YYYY-MM-DD'
   * @param {number|string} [params.salary_structure_id] - Optional structure override
   * @param {number|string} [params.contract_id] - Optional contract override
   * @param {object} [params.custom_context] - Optional override values for simulation/testing
   */
  async calculateEmployeePayroll(params) {
    const {
      employee_id,
      period_start,
      period_end,
      salary_structure_id: structureIdOverride,
      contract_id: contractIdOverride,
      custom_context = {}
    } = params;

    // 1. Verify Employee exists
    const employee = await EmployeeModel.findById(employee_id);
    if (!employee) {
      const error = new Error(`Employee with ID ${employee_id} not found`);
      error.statusCode = 404;
      error.code = 'EMPLOYEE_NOT_FOUND';
      throw error;
    }

    // 2. Contract Resolution
    let contract;
    if (contractIdOverride) {
      contract = await db('contracts')
        .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
        .leftJoin('working_schedules', 'contracts.working_schedule_id', 'working_schedules.id')
        .where('contracts.id', contractIdOverride)
        .where('contracts.employee_id', employee_id)
        .select(
          'contracts.*',
          'salary_structures.name as salary_structure_name',
          'salary_structures.code as salary_structure_code',
          'working_schedules.name as schedule_name'
        )
        .first();

      if (!contract) {
        const error = new Error(`Specified contract ID ${contractIdOverride} not found for employee ${employee_id}`);
        error.statusCode = 404;
        error.code = 'CONTRACT_NOT_FOUND';
        throw error;
      }
    } else {
      // Critical Contract Resolution using contractService
      contract = await contractService.getApplicableContract(employee_id, period_start, period_end);
    }

    // 3. Salary Structure Resolution
    const targetStructureId = structureIdOverride || contract.salary_structure_id;
    if (!targetStructureId) {
      const error = new Error(
        `No salary structure assigned to contract '${contract.contract_number}' or provided in request`
      );
      error.statusCode = 400;
      error.code = 'NO_SALARY_STRUCTURE';
      throw error;
    }

    const structure = await SalaryStructureModel.findById(targetStructureId);
    if (!structure || !structure.is_active) {
      const error = new Error(
        `Salary structure with ID ${targetStructureId} does not exist or is inactive`
      );
      error.statusCode = 400;
      error.code = 'INVALID_SALARY_STRUCTURE';
      throw error;
    }

    // 4. Fetch Active Salary Rules sorted by sequence ASC
    const rules = await db('salary_rules')
      .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id')
      .where('salary_rules.salary_structure_id', targetStructureId)
      .where('salary_rules.is_active', true)
      .select(
        'salary_rules.*',
        'salary_rule_categories.name as category_name',
        'salary_rule_categories.code as category_code'
      )
      .orderBy('salary_rules.sequence', 'asc')
      .orderBy('salary_rules.id', 'asc');

    if (!rules || rules.length === 0) {
      const error = new Error(
        `Salary structure '${structure.name}' contains no active salary rules`
      );
      error.statusCode = 400;
      error.code = 'NO_ACTIVE_SALARY_RULES';
      throw error;
    }

    // 5. Gather Schedule, Attendance, and Time-off contexts
    const scheduleId = contract.working_schedule_id || employee.working_schedule_id;
    const scheduleSummary = await this.getScheduleWorkingDays(scheduleId, period_start, period_end);
    const attendanceSummary = await this.getAttendanceSummary(employee_id, period_start, period_end);
    const timeOffSummary = await this.getTimeOffSummary(employee_id, period_start, period_end);

    // If no attendance was logged yet, default worked_days to scheduled_days (standard full attendance baseline)
    const effectiveWorkedDays =
      custom_context.worked_days !== undefined
        ? Number(custom_context.worked_days)
        : attendanceSummary.total_attendance_records > 0
        ? attendanceSummary.worked_days
        : scheduleSummary.scheduled_days;

    const effectiveWorkedHours =
      custom_context.worked_hours !== undefined
        ? Number(custom_context.worked_hours)
        : attendanceSummary.total_attendance_records > 0
        ? attendanceSummary.worked_hours
        : scheduleSummary.scheduled_hours;

    const effectiveUnpaidLeaves =
      custom_context.unpaid_leaves !== undefined
        ? Number(custom_context.unpaid_leaves)
        : timeOffSummary.unpaid_leave_days;

    const effectivePaidLeaves =
      custom_context.paid_leaves !== undefined
        ? Number(custom_context.paid_leaves)
        : timeOffSummary.paid_leave_days;

    // 6. Build Initial Evaluation Context
    const wage = Number(contract.wage) || 0;
    const evaluationContext = {
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        wage,
        employment_type: contract.employment_type
      },
      wage,
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name
      },
      period: {
        period_start,
        period_end,
        total_days: scheduleSummary.total_calendar_days
      },
      schedule: {
        scheduled_days: scheduleSummary.scheduled_days,
        scheduled_hours: scheduleSummary.scheduled_hours
      },
      scheduled_days: scheduleSummary.scheduled_days,
      scheduled_hours: scheduleSummary.scheduled_hours,
      attendance: {
        worked_minutes: attendanceSummary.worked_minutes,
        worked_hours: effectiveWorkedHours,
        present_days: attendanceSummary.present_days,
        late_days: attendanceSummary.late_days,
        half_days: attendanceSummary.half_days,
        absent_days: attendanceSummary.absent_days,
        worked_days: effectiveWorkedDays
      },
      worked_days: effectiveWorkedDays,
      worked_hours: effectiveWorkedHours,
      absent_days: attendanceSummary.absent_days,
      time_off: {
        paid_days: effectivePaidLeaves,
        unpaid_days: effectiveUnpaidLeaves,
        total_days: effectivePaidLeaves + effectiveUnpaidLeaves
      },
      paid_leaves: effectivePaidLeaves,
      unpaid_leaves: effectiveUnpaidLeaves,
      rules: {},
      ...custom_context
    };

    // 7. Execute Salary Rules Sequentially
    const ruleLines = [];
    const categoryTotals = {
      BASIC: 0,
      ALW: 0,
      GROSS: 0,
      DED: 0,
      NET: 0
    };

    for (const rule of rules) {
      const isConditionMet = evaluateCondition(rule.condition_expression, evaluationContext);
      let calculatedAmount = 0;
      let calculationDetails = '';

      if (!isConditionMet) {
        calculatedAmount = 0;
        calculationDetails = `Condition not met (${rule.condition_expression || 'skipped'})`;
      } else {
        const calcType = (rule.calculation_type || 'fixed').toLowerCase();

        if (calcType === 'fixed') {
          calculatedAmount = Number(rule.value) || 0;
          calculationDetails = `Fixed amount: ${calculatedAmount.toFixed(2)}`;
        } else if (calcType === 'percentage') {
          const rate = Number(rule.value) || 0;
          let baseValue = wage;

          if (rule.formula_expression && rule.formula_expression.trim()) {
            baseValue = Number(evaluateFormula(rule.formula_expression, evaluationContext)) || 0;
          }

          calculatedAmount = (rate / 100) * baseValue;
          calculationDetails = `${rate.toFixed(2)}% of ${rule.formula_expression || 'wage'} (${baseValue.toFixed(2)})`;
        } else if (calcType === 'formula') {
          if (!rule.formula_expression || !rule.formula_expression.trim()) {
            calculatedAmount = 0;
            calculationDetails = 'No formula expression defined';
          } else {
            const rawResult = evaluateFormula(rule.formula_expression, evaluationContext);
            calculatedAmount = Number(rawResult) || 0;
            calculationDetails = `Formula: ${rule.formula_expression} => ${calculatedAmount.toFixed(2)}`;
          }
        }
      }

      calculatedAmount = Number(calculatedAmount.toFixed(2));

      // Update runtime evaluation context with this rule's computed amount
      evaluationContext[rule.code] = calculatedAmount;
      evaluationContext.rules[rule.code] = calculatedAmount;

      const catCode = (rule.category_code || 'ALW').toUpperCase();
      if (categoryTotals[catCode] !== undefined) {
        categoryTotals[catCode] += calculatedAmount;
      } else {
        categoryTotals[catCode] = calculatedAmount;
      }

      // Keep cumulative running totals updated in context
      evaluationContext.BASIC = categoryTotals.BASIC || 0;
      evaluationContext.ALW = categoryTotals.ALW || 0;
      evaluationContext.ALLOWANCE = categoryTotals.ALW || 0;
      evaluationContext.GROSS = categoryTotals.GROSS > 0 ? categoryTotals.GROSS : (categoryTotals.BASIC + categoryTotals.ALW);
      evaluationContext.DED = categoryTotals.DED || 0;
      evaluationContext.DEDUCTION = categoryTotals.DED || 0;

      ruleLines.push({
        rule_id: rule.id,
        code: rule.code,
        name: rule.name,
        category_id: rule.category_id,
        category_code: rule.category_code,
        category_name: rule.category_name,
        sequence: rule.sequence,
        calculation_type: rule.calculation_type,
        condition_expression: rule.condition_expression,
        formula_expression: rule.formula_expression,
        condition_met: isConditionMet,
        quantity: 1,
        rate: rule.calculation_type === 'percentage' ? Number(rule.value) : null,
        amount: calculatedAmount,
        calculation_details: calculationDetails
      });
    }

    // 8. Final Summaries Calculation
    const basicSalary = Number((categoryTotals.BASIC || 0).toFixed(2));
    const totalAllowances = Number((categoryTotals.ALW || 0).toFixed(2));
    
    // Gross: If explicit GROSS rule was calculated, use it; else sum Basic + Allowances
    const grossSalary = categoryTotals.GROSS > 0
      ? Number(categoryTotals.GROSS.toFixed(2))
      : Number((basicSalary + totalAllowances).toFixed(2));

    const totalDeductions = Number((categoryTotals.DED || 0).toFixed(2));

    // Net: If explicit NET rule was calculated, use it; else gross - deductions
    const netSalary = categoryTotals.NET > 0
      ? Number(categoryTotals.NET.toFixed(2))
      : Number(Math.max(0, grossSalary - totalDeductions).toFixed(2));

    return {
      employee: {
        id: employee.id,
        employee_code: employee.employee_code,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        department_name: contract.department_name,
        job_position_title: contract.job_position_title
      },
      contract: {
        id: contract.id,
        contract_number: contract.contract_number,
        wage: Number(contract.wage),
        employment_type: contract.employment_type,
        start_date: contract.start_date,
        end_date: contract.end_date
      },
      salary_structure: {
        id: structure.id,
        name: structure.name,
        code: structure.code
      },
      period: {
        period_start,
        period_end,
        total_calendar_days: scheduleSummary.total_calendar_days
      },
      schedule_summary: scheduleSummary,
      attendance_summary: {
        ...attendanceSummary,
        effective_worked_days: effectiveWorkedDays,
        effective_worked_hours: effectiveWorkedHours
      },
      time_off_summary: {
        ...timeOffSummary,
        effective_paid_leaves: effectivePaidLeaves,
        effective_unpaid_leaves: effectiveUnpaidLeaves
      },
      rule_lines: ruleLines,
      category_totals: {
        basic: basicSalary,
        allowances: totalAllowances,
        gross: grossSalary,
        deductions: totalDeductions,
        net: netSalary
      },
      gross_salary: grossSalary,
      total_deductions: totalDeductions,
      net_salary: netSalary
    };
  }

  /**
   * Simulate payroll calculation with custom or hypothetical inputs
   *
   * @param {object} params
   */
  async simulatePayroll(params) {
    const {
      wage,
      salary_structure_id,
      rules: customRules,
      period_start = '2026-09-01',
      period_end = '2026-09-30',
      worked_days = 22,
      scheduled_days = 22,
      unpaid_leaves = 0,
      paid_leaves = 0
    } = params;

    let rulesToProcess = [];
    let structureInfo = { id: null, name: 'Simulated Structure', code: 'SIM_STRUCT' };

    if (salary_structure_id) {
      const structure = await SalaryStructureModel.findById(salary_structure_id);
      if (structure) {
        structureInfo = { id: structure.id, name: structure.name, code: structure.code };
      }

      rulesToProcess = await db('salary_rules')
        .leftJoin('salary_rule_categories', 'salary_rules.category_id', 'salary_rule_categories.id')
        .where('salary_rules.salary_structure_id', salary_structure_id)
        .where('salary_rules.is_active', true)
        .select(
          'salary_rules.*',
          'salary_rule_categories.name as category_name',
          'salary_rule_categories.code as category_code'
        )
        .orderBy('salary_rules.sequence', 'asc');
    } else if (Array.isArray(customRules)) {
      rulesToProcess = customRules.map((r, idx) => ({
        id: r.id || idx + 1,
        code: r.code,
        name: r.name || r.code,
        category_code: (r.category_code || 'ALW').toUpperCase(),
        category_name: r.category_name || r.category_code || 'Allowance',
        sequence: r.sequence !== undefined ? Number(r.sequence) : idx + 1,
        calculation_type: r.calculation_type || 'fixed',
        value: Number(r.value) || 0,
        condition_expression: r.condition_expression || null,
        formula_expression: r.formula_expression || null
      })).sort((a, b) => a.sequence - b.sequence);
    }

    const baseWage = Number(wage) || 0;
    const evaluationContext = {
      contract: {
        id: 0,
        contract_number: 'SIMULATED-CONTRACT',
        wage: baseWage,
        employment_type: 'full_time'
      },
      wage: baseWage,
      period: {
        period_start,
        period_end
      },
      scheduled_days: Number(scheduled_days),
      worked_days: Number(worked_days),
      unpaid_leaves: Number(unpaid_leaves),
      paid_leaves: Number(paid_leaves),
      rules: {}
    };

    const ruleLines = [];
    const categoryTotals = {
      BASIC: 0,
      ALW: 0,
      GROSS: 0,
      DED: 0,
      NET: 0
    };

    for (const rule of rulesToProcess) {
      const isConditionMet = evaluateCondition(rule.condition_expression, evaluationContext);
      let calculatedAmount = 0;
      let calculationDetails = '';

      if (!isConditionMet) {
        calculatedAmount = 0;
        calculationDetails = `Condition not met (${rule.condition_expression})`;
      } else {
        const calcType = (rule.calculation_type || 'fixed').toLowerCase();

        if (calcType === 'fixed') {
          calculatedAmount = Number(rule.value) || 0;
          calculationDetails = `Fixed amount: ${calculatedAmount.toFixed(2)}`;
        } else if (calcType === 'percentage') {
          const rate = Number(rule.value) || 0;
          let baseValue = baseWage;

          if (rule.formula_expression && rule.formula_expression.trim()) {
            baseValue = Number(evaluateFormula(rule.formula_expression, evaluationContext)) || 0;
          }

          calculatedAmount = (rate / 100) * baseValue;
          calculationDetails = `${rate.toFixed(2)}% of ${rule.formula_expression || 'wage'} (${baseValue.toFixed(2)})`;
        } else if (calcType === 'formula') {
          const rawResult = evaluateFormula(rule.formula_expression, evaluationContext);
          calculatedAmount = Number(rawResult) || 0;
          calculationDetails = `Formula: ${rule.formula_expression} => ${calculatedAmount.toFixed(2)}`;
        }
      }

      calculatedAmount = Number(calculatedAmount.toFixed(2));
      evaluationContext[rule.code] = calculatedAmount;
      evaluationContext.rules[rule.code] = calculatedAmount;

      const catCode = (rule.category_code || 'ALW').toUpperCase();
      if (categoryTotals[catCode] !== undefined) {
        categoryTotals[catCode] += calculatedAmount;
      } else {
        categoryTotals[catCode] = calculatedAmount;
      }

      evaluationContext.BASIC = categoryTotals.BASIC || 0;
      evaluationContext.ALW = categoryTotals.ALW || 0;
      evaluationContext.ALLOWANCE = categoryTotals.ALW || 0;
      evaluationContext.GROSS = categoryTotals.GROSS > 0 ? categoryTotals.GROSS : (categoryTotals.BASIC + categoryTotals.ALW);
      evaluationContext.DED = categoryTotals.DED || 0;
      evaluationContext.DEDUCTION = categoryTotals.DED || 0;

      ruleLines.push({
        rule_id: rule.id,
        code: rule.code,
        name: rule.name,
        category_code: rule.category_code,
        sequence: rule.sequence,
        calculation_type: rule.calculation_type,
        condition_expression: rule.condition_expression,
        formula_expression: rule.formula_expression,
        condition_met: isConditionMet,
        rate: rule.calculation_type === 'percentage' ? Number(rule.value) : null,
        amount: calculatedAmount,
        calculation_details: calculationDetails
      });
    }

    const basicSalary = Number((categoryTotals.BASIC || 0).toFixed(2));
    const totalAllowances = Number((categoryTotals.ALW || 0).toFixed(2));
    const grossSalary = categoryTotals.GROSS > 0
      ? Number(categoryTotals.GROSS.toFixed(2))
      : Number((basicSalary + totalAllowances).toFixed(2));
    const totalDeductions = Number((categoryTotals.DED || 0).toFixed(2));
    const netSalary = categoryTotals.NET > 0
      ? Number(categoryTotals.NET.toFixed(2))
      : Number(Math.max(0, grossSalary - totalDeductions).toFixed(2));

    return {
      is_simulation: true,
      wage: baseWage,
      salary_structure: structureInfo,
      period: { period_start, period_end },
      simulation_inputs: {
        worked_days,
        scheduled_days,
        unpaid_leaves,
        paid_leaves
      },
      rule_lines: ruleLines,
      category_totals: {
        basic: basicSalary,
        allowances: totalAllowances,
        gross: grossSalary,
        deductions: totalDeductions,
        net: netSalary
      },
      gross_salary: grossSalary,
      total_deductions: totalDeductions,
      net_salary: netSalary
    };
  }

  /**
   * Batch Payroll Preview for multiple employees
   *
   * @param {object} params
   */
  async calculateBatchPreview(params) {
    const {
      period_start,
      period_end,
      employee_ids,
      department_id
    } = params;

    let employeeQuery = db('employees').where('employment_status', 'active');
    if (employee_ids && employee_ids.length > 0) {
      employeeQuery = employeeQuery.whereIn('id', employee_ids);
    }
    if (department_id) {
      employeeQuery = employeeQuery.where('department_id', department_id);
    }

    const activeEmployees = await employeeQuery.select('id', 'employee_code', 'first_name', 'last_name');

    const results = [];
    const errors = [];

    for (const emp of activeEmployees) {
      try {
        const calculation = await this.calculateEmployeePayroll({
          employee_id: emp.id,
          period_start,
          period_end
        });
        results.push(calculation);
      } catch (err) {
        errors.push({
          employee_id: emp.id,
          employee_code: emp.employee_code,
          employee_name: `${emp.first_name} ${emp.last_name}`,
          error: err.message,
          code: err.code || 'CALCULATION_ERROR'
        });
      }
    }

    const totalGross = results.reduce((sum, r) => sum + r.gross_salary, 0);
    const totalDeductions = results.reduce((sum, r) => sum + r.total_deductions, 0);
    const totalNet = results.reduce((sum, r) => sum + r.net_salary, 0);

    return {
      period: { period_start, period_end },
      total_employees_processed: activeEmployees.length,
      successful_calculations: results.length,
      failed_calculations: errors.length,
      summary_totals: {
        total_gross: Number(totalGross.toFixed(2)),
        total_deductions: Number(totalDeductions.toFixed(2)),
        total_net: Number(totalNet.toFixed(2))
      },
      results,
      errors
    };
  }
}

export default new PayrollCalculationService();
