/**
 * Automated Test Suite - Phase 9: Payroll Calculation Engine
 */

import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

// Ensure test port
process.env.PORT = '5095';

import app from './index.js';
import { db } from './src/models/index.js';
import { seedRbac } from './src/config/seedRbac.js';
import { generateAccessToken } from './src/utils/tokens.js';
import { evaluateFormula, evaluateCondition } from './src/utils/safeFormulaEvaluator.js';
import payrollCalculationService from './src/services/payrollCalculationService.js';

let server;
const BASE_URL = 'http://127.0.0.1:5095/api';

let adminToken;
let employee1Token;
let employee2Token;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

const assert = (condition, message) => {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
};

const makeRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  return { status: response.status, data, headers: response.headers };
};

const runTests = async () => {
  console.log('🧪 ================= STARTING PHASE 9 TESTS: PAYROLL CALCULATION ENGINE ================= 🧪\n');

  try {
    // 1. Seed RBAC
    await seedRbac();

    // 2. Setup test users and data
    // Ensure test roles exist
    const adminRole = await db('roles').where({ code: 'ADMIN' }).first();
    const empRole = await db('roles').where({ code: 'EMPLOYEE' }).first();

    // Ensure departments
    let dept = await db('departments').where({ code: 'ENG' }).first();
    if (!dept) {
      const [id] = await db('departments').insert({
        name: 'Engineering',
        code: 'ENG',
        description: 'Software Engineering Department'
      });
      dept = { id, name: 'Engineering', code: 'ENG' };
    }

    // Ensure job position
    let pos = await db('job_positions').where({ code: 'SWE' }).first();
    if (!pos) {
      const [id] = await db('job_positions').insert({
        department_id: dept.id,
        title: 'Software Engineer',
        code: 'SWE'
      });
      pos = { id, title: 'Software Engineer', code: 'SWE' };
    }

    // Ensure working schedule
    let sched = await db('working_schedules').where({ name: 'Standard 40h' }).first();
    if (!sched) {
      const [id] = await db('working_schedules').insert({
        name: 'Standard 40h',
        description: 'Monday to Friday 8 hours per day',
        is_active: true
      });
      sched = { id, name: 'Standard 40h' };

      const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      for (const day of days) {
        await db('schedule_days').insert({
          schedule_id: sched.id,
          day_of_week: day,
          start_time: '09:00:00',
          end_time: '17:00:00',
          break_minutes: 0
        });
      }
    }

    // Clean up test employees 901 & 902
    await db('payslips').whereIn('employee_id', [901, 902]).del();
    await db('attendance').whereIn('employee_id', [901, 902]).del();
    await db('time_off_requests').whereIn('employee_id', [901, 902]).del();
    await db('time_off_allocations').whereIn('employee_id', [901, 902]).del();
    await db('contracts').whereIn('employee_id', [901, 902]).del();
    await db('users').whereIn('email', ['p9_admin@test.com', 'p9_emp1@test.com', 'p9_emp2@test.com']).del();
    await db('employees').whereIn('id', [901, 902]).del();

    // Create Employees
    await db('employees').insert({
      id: 901,
      employee_code: 'P9EMP901',
      first_name: 'Alice',
      last_name: 'Payroll',
      email: 'p9_emp1@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2020-01-01',
      employment_status: 'active'
    });

    await db('employees').insert({
      id: 902,
      employee_code: 'P9EMP902',
      first_name: 'Bob',
      last_name: 'Payroll',
      email: 'p9_emp2@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2020-01-01',
      employment_status: 'active'
    });

    // Create Users
    const [adminUserId] = await db('users').insert({
      email: 'p9_admin@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: adminRole.id,
      is_active: true
    });

    const [emp1UserId] = await db('users').insert({
      employee_id: 901,
      email: 'p9_emp1@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: empRole.id,
      is_active: true
    });

    const [emp2UserId] = await db('users').insert({
      employee_id: 902,
      email: 'p9_emp2@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: empRole.id,
      is_active: true
    });

    // Generate JWT Tokens
    adminToken = generateAccessToken({ id: adminUserId, email: 'p9_admin@test.com', role_code: 'ADMIN', role_name: 'Admin' });
    employee1Token = generateAccessToken({ id: emp1UserId, employee_id: 901, email: 'p9_emp1@test.com', role_code: 'EMPLOYEE', role_name: 'Employee' });
    employee2Token = generateAccessToken({ id: emp2UserId, employee_id: 902, email: 'p9_emp2@test.com', role_code: 'EMPLOYEE', role_name: 'Employee' });

    // Setup Salary Categories
    const categories = [
      { id: 1, name: 'Basic', code: 'BASIC' },
      { id: 2, name: 'Allowance', code: 'ALW' },
      { id: 3, name: 'Gross', code: 'GROSS' },
      { id: 4, name: 'Deduction', code: 'DED' },
      { id: 5, name: 'Net', code: 'NET' }
    ];

    for (const cat of categories) {
      const existing = await db('salary_rule_categories').where({ id: cat.id }).first();
      if (!existing) {
        await db('salary_rule_categories').insert({
          id: cat.id,
          name: cat.name,
          code: cat.code
        });
      }
    }

    // Setup Test Salary Structure
    let testStructure = await db('salary_structures').where({ code: 'P9_STANDARD' }).first();
    if (!testStructure) {
      const [structId] = await db('salary_structures').insert({
        name: 'Phase 9 Standard Salary Structure',
        code: 'P9_STANDARD',
        description: 'Standard formula based structure for phase 9 tests',
        is_active: true
      });
      testStructure = { id: structId, code: 'P9_STANDARD' };
    }

    // Delete existing rules for this structure to keep it clean
    await db('salary_rules').where({ salary_structure_id: testStructure.id }).del();

    // Insert Standard Test Salary Rules
    // 1. BASIC: 50% of wage
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 1,
      name: 'Basic Salary',
      code: 'BASIC',
      sequence: 1,
      calculation_type: 'percentage',
      value: 50.00,
      condition_expression: null,
      formula_expression: 'contract.wage',
      is_active: true
    });

    // 2. HRA: 20% of wage
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 2,
      name: 'House Rent Allowance',
      code: 'HRA',
      sequence: 2,
      calculation_type: 'percentage',
      value: 20.00,
      condition_expression: null,
      formula_expression: 'contract.wage',
      is_active: true
    });

    // 3. SA: 30% of wage
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 2,
      name: 'Special Allowance',
      code: 'SA',
      sequence: 3,
      calculation_type: 'percentage',
      value: 30.00,
      condition_expression: null,
      formula_expression: 'contract.wage',
      is_active: true
    });

    // 4. GROSS: BASIC + HRA + SA
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 3,
      name: 'Gross Salary',
      code: 'GROSS',
      sequence: 10,
      calculation_type: 'formula',
      value: 0.00,
      condition_expression: null,
      formula_expression: 'BASIC + HRA + SA',
      is_active: true
    });

    // 5. PF: 12% of BASIC
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 4,
      name: 'Provident Fund (PF)',
      code: 'PF',
      sequence: 20,
      calculation_type: 'percentage',
      value: 12.00,
      condition_expression: null,
      formula_expression: 'BASIC',
      is_active: true
    });

    // 6. PT: Fixed $200
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 4,
      name: 'Professional Tax (PT)',
      code: 'PT',
      sequence: 21,
      calculation_type: 'fixed',
      value: 200.00,
      condition_expression: null,
      formula_expression: null,
      is_active: true
    });

    // 7. BONUS: Conditional $5000 if worked_days >= 20
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 2,
      name: 'Attendance Performance Bonus',
      code: 'BONUS',
      sequence: 25,
      calculation_type: 'fixed',
      value: 5000.00,
      condition_expression: 'worked_days >= 20',
      formula_expression: null,
      is_active: true
    });

    // 8. LOP (Loss of Pay Deduction): (wage / scheduled_days) * unpaid_leaves
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 4,
      name: 'Unpaid Leave Deduction',
      code: 'LOP',
      sequence: 30,
      calculation_type: 'formula',
      value: 0.00,
      condition_expression: 'unpaid_leaves > 0',
      formula_expression: '(contract.wage / scheduled_days) * unpaid_leaves',
      is_active: true
    });

    // 9. NET: GROSS + (BONUS || 0) - (PF + PT + (LOP || 0))
    await db('salary_rules').insert({
      salary_structure_id: testStructure.id,
      category_id: 5,
      name: 'Net Salary',
      code: 'NET',
      sequence: 100,
      calculation_type: 'formula',
      value: 0.00,
      condition_expression: null,
      formula_expression: 'GROSS + BONUS - (PF + PT + LOP)',
      is_active: true
    });

    // Create Active Contract for Employee 901 (Wage: $100,000)
    await db('contracts').insert({
      employee_id: 901,
      contract_number: 'CNT-P9-901',
      start_date: '2026-01-01',
      end_date: null,
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      salary_structure_id: testStructure.id,
      wage: 100000.00,
      employment_type: 'full_time',
      status: 'active'
    });

    // =========================================================================
    // 1. UNIT TESTS: SAFE FORMULA & EXPRESSION EVALUATOR
    // =========================================================================
    console.log('--- 1. Unit Tests: Safe Formula & Expression Evaluator ---');
    {
      const context = {
        contract: { wage: 100000 },
        wage: 100000,
        BASIC: 50000,
        HRA: 20000,
        SA: 30000,
        worked_days: 22,
        scheduled_days: 22,
        unpaid_leaves: 2
      };

      const basicCalc = evaluateFormula('contract.wage * 0.50', context);
      assert(basicCalc === 50000, 'contract.wage * 0.50 evaluates to 50000');

      const grossCalc = evaluateFormula('BASIC + HRA + SA', context);
      assert(grossCalc === 100000, 'BASIC + HRA + SA evaluates to 100000');

      const lopCalc = evaluateFormula('(wage / scheduled_days) * unpaid_leaves', context);
      assert(Math.round(lopCalc) === Math.round((100000 / 22) * 2), 'Loss of pay formula evaluates accurately');

      const condTrue = evaluateCondition('worked_days >= 20', context);
      assert(condTrue === true, 'Condition worked_days >= 20 evaluates to true');

      const condFalse = evaluateCondition('unpaid_leaves > 5', context);
      assert(condFalse === false, 'Condition unpaid_leaves > 5 evaluates to false');

      // Security test: Injection attempt
      let blocked = false;
      try {
        evaluateFormula('process.exit(1)', context);
      } catch (e) {
        blocked = e.code === 'UNSAFE_EXPRESSION';
      }
      assert(blocked, 'Security injection with process.exit is blocked with UNSAFE_EXPRESSION');
    }

    // =========================================================================
    // 2. CONTRACT RESOLUTION & PAYROLL CALCULATION ENGINE
    // =========================================================================
    console.log('\n--- 2. Payroll Calculation Engine (Employee 901) ---');
    {
      // Calculate for September 2026 (22 working days in standard Mon-Fri schedule)
      const res = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          employee_id: 901,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });

      assert(res.status === 200, 'POST /api/payroll/calculate returns 200 OK');
      assert(res.data.success === true, 'Response success is true');
      
      const calc = res.data.data;
      assert(calc.employee.id === 901, 'Calculated for employee 901');
      assert(calc.contract.contract_number === 'CNT-P9-901', 'Resolved applicable contract CNT-P9-901');
      assert(calc.contract.wage === 100000, 'Contract wage is 100,000');
      assert(calc.salary_structure.code === 'P9_STANDARD', 'Used salary structure P9_STANDARD');

      // Check Rule Lines
      const lineMap = {};
      calc.rule_lines.forEach(l => { lineMap[l.code] = l.amount; });

      assert(lineMap.BASIC === 50000, 'BASIC rule computed as $50,000 (50% of wage)');
      assert(lineMap.HRA === 20000, 'HRA rule computed as $20,000 (20% of wage)');
      assert(lineMap.SA === 30000, 'SA rule computed as $30,000 (30% of wage)');
      assert(lineMap.GROSS === 100000, 'GROSS rule computed as $100,000 (BASIC + HRA + SA)');
      assert(lineMap.PF === 6000, 'PF rule computed as $6,000 (12% of BASIC 50000)');
      assert(lineMap.PT === 200, 'PT rule computed as fixed $200');
      assert(lineMap.BONUS === 5000, 'BONUS condition met (worked_days >= 20) => $5,000 awarded');
      assert(lineMap.LOP === 0, 'LOP condition not met (unpaid_leaves = 0) => $0 deduction');

      // Total Deductions = PF (6000) + PT (200) = 6200
      assert(calc.total_deductions === 6200, 'Total deductions correctly calculated as $6,200');
      
      // NET = GROSS (100000) + BONUS (5000) - Deductions (6200) = 98800
      assert(calc.net_salary === 98800, 'Net salary correctly computed as $98,800');
    }

    // =========================================================================
    // 3. ATTENDANCE & UNPAID TIME OFF INTEGRATION
    // =========================================================================
    console.log('\n--- 3. Attendance & Unpaid Time-Off Loss-Of-Pay Integration ---');
    {
      // Insert an unpaid time-off type
      let unpaidType = await db('time_off_types').where({ code: 'UNPAID_P9' }).first();
      if (!unpaidType) {
        const [id] = await db('time_off_types').insert({
          name: 'Unpaid Leave (Loss of Pay)',
          code: 'UNPAID_P9',
          unit: 'days',
          requires_allocation: false,
          requires_approval: true,
          is_paid: false,
          is_active: true
        });
        unpaidType = { id, code: 'UNPAID_P9', is_paid: false };
      }

      // Insert 2 days approved unpaid leave for employee 901 in September 2026
      await db('time_off_requests').insert({
        employee_id: 901,
        time_off_type_id: unpaidType.id,
        start_date: '2026-09-10',
        end_date: '2026-09-11',
        duration: 2.00,
        status: 'approved',
        reason: 'Personal unpaid leave'
      });

      // Recalculate payroll
      const res = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          employee_id: 901,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });

      assert(res.status === 200, 'Payroll recalculation with unpaid leave returns 200');
      const calc = res.data.data;
      assert(calc.time_off_summary.effective_unpaid_leaves === 2, 'Detected 2 unpaid leave days');

      const lineMap = {};
      calc.rule_lines.forEach(l => { lineMap[l.code] = l.amount; });

      // LOP deduction: (100000 / 22 scheduled_days) * 2 = 9090.91
      assert(lineMap.LOP > 9000 && lineMap.LOP < 9150, `LOP deduction calculated: $${lineMap.LOP}`);
      assert(calc.total_deductions > 15000, `Total deductions increased to $${calc.total_deductions}`);
    }

    // =========================================================================
    // 4. CONTRACT VALIDATION & ERROR HANDLING
    // =========================================================================
    console.log('\n--- 4. Contract Validation & Error Handling ---');
    {
      // Employee 902 has NO active contract yet
      const noContractRes = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          employee_id: 902,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });

      assert(noContractRes.status === 404, 'Employee without active contract returns 404 Not Found');
      assert(noContractRes.data.code === 'NO_APPLICABLE_CONTRACT', 'Returns code NO_APPLICABLE_CONTRACT');

      // Non-existent employee
      const noEmpRes = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          employee_id: 99999,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });
      assert(noEmpRes.status === 404, 'Non-existent employee returns 404 Not Found');
      assert(noEmpRes.data.code === 'EMPLOYEE_NOT_FOUND', 'Returns code EMPLOYEE_NOT_FOUND');

      // Invalid dates (period_end before period_start)
      const invalidDateRes = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          employee_id: 901,
          period_start: '2026-09-30',
          period_end: '2026-09-01'
        })
      });
      assert(invalidDateRes.status === 400, 'Invalid date range returns 400 Bad Request');
    }

    // =========================================================================
    // 5. INTERACTIVE PAYROLL SIMULATION
    // =========================================================================
    console.log('\n--- 5. Interactive Payroll Simulation ---');
    {
      const simRes = await makeRequest('/payroll/simulate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          wage: 150000,
          salary_structure_id: testStructure.id,
          worked_days: 22,
          scheduled_days: 22,
          unpaid_leaves: 0
        })
      });

      assert(simRes.status === 200, 'POST /api/payroll/simulate returns 200 OK');
      const simData = simRes.data.data;
      assert(simData.is_simulation === true, 'Marked as simulation result');
      assert(simData.wage === 150000, 'Simulated base wage is $150,000');
      assert(simData.gross_salary === 150000, 'Simulated gross salary is $150,000');

      const simLines = {};
      simData.rule_lines.forEach(l => { simLines[l.code] = l.amount; });
      assert(simLines.BASIC === 75000, 'Simulated BASIC is $75,000 (50% of 150k)');
      assert(simLines.PF === 9000, 'Simulated PF is $9,000 (12% of 75k)');
      assert(simData.net_salary === 145800, 'Simulated Net salary is $145,800');
    }

    // =========================================================================
    // 6. BATCH PAYROLL PREVIEW
    // =========================================================================
    console.log('\n--- 6. Batch Payroll Preview ---');
    {
      const batchRes = await makeRequest('/payroll/calculate-batch-preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          period_start: '2026-09-01',
          period_end: '2026-09-30',
          employee_ids: [901, 902]
        })
      });

      assert(batchRes.status === 200, 'POST /api/payroll/calculate-batch-preview returns 200 OK');
      const batchData = batchRes.data.data;
      assert(batchData.total_employees_processed === 2, 'Processed 2 employees in batch');
      assert(batchData.successful_calculations === 1, 'Employee 901 calculated successfully');
      assert(batchData.failed_calculations === 1, 'Employee 902 recorded error (missing contract)');
      assert(batchData.summary_totals.total_gross > 0, 'Batch gross total aggregated');
    }

    // =========================================================================
    // 7. RBAC & OWNERSHIP PROTECTIONS
    // =========================================================================
    console.log('\n--- 7. RBAC & Ownership Protections ---');
    {
      // Employee 901 calculating their own payroll -> ALLOWED
      const selfRes = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${employee1Token}` },
        body: JSON.stringify({
          employee_id: 901,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });
      assert(selfRes.status === 200, 'Employee can calculate their own payroll preview');

      // Employee 902 attempting to calculate Employee 901's payroll -> FORBIDDEN (403)
      const attackRes = await makeRequest('/payroll/calculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${employee2Token}` },
        body: JSON.stringify({
          employee_id: 901,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });
      assert(attackRes.status === 403, 'Employee attempting to calculate other employee payroll rejected with 403 Forbidden');
      assert(attackRes.data.code === 'FORBIDDEN', 'Returns code FORBIDDEN');

      // Employee attempting to access batch preview -> FORBIDDEN (403)
      const empBatchRes = await makeRequest('/payroll/calculate-batch-preview', {
        method: 'POST',
        headers: { Authorization: `Bearer ${employee1Token}` },
        body: JSON.stringify({
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });
      assert(empBatchRes.status === 403, 'Normal Employee blocked from batch preview (403 Forbidden)');

      // Unauthenticated request -> UNAUTHORIZED (401)
      const unauthRes = await makeRequest('/payroll/calculate', {
        method: 'POST',
        body: JSON.stringify({
          employee_id: 901,
          period_start: '2026-09-01',
          period_end: '2026-09-30'
        })
      });
      assert(unauthRes.status === 401, 'Unauthenticated payroll calculation returns 401 Unauthorized');
    }

    console.log('\n======================================================');
    console.log(`📊 PHASE 9 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
    console.log('======================================================\n');

  } catch (err) {
    console.error('❌ Test execution error:', err);
  } finally {
    if (server) {
      server.close();
    }
    process.exit(failedTests > 0 ? 1 : 0);
  }
};

// Start test server and run
server = app.listen(5095, async () => {
  console.log('🧪 Phase 9 Test Server running on port 5095');
  await runTests();
});
