/**
 * Automated Test Suite - Phase 10: Payrun Management
 */

import dotenv from 'dotenv';
dotenv.config();

// Ensure test port
process.env.PORT = '5094';

import app from './index.js';
import { db } from './src/models/index.js';
import { seedRbac } from './src/config/seedRbac.js';
import { generateAccessToken } from './src/utils/tokens.js';

let server;
const BASE_URL = 'http://127.0.0.1:5094/api';

let adminToken;
let payrollManagerToken;
let payrollUserToken;
let hrManagerToken;
let employeeToken;

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
  console.log('🧪 ================= STARTING PHASE 10 TESTS: PAYRUN MANAGEMENT ================= 🧪\n');

  try {
    // 1. Seed RBAC
    await seedRbac();

    // 2. Fetch Roles
    const adminRole = await db('roles').where({ code: 'ADMIN' }).first();
    const payrollMgrRole = await db('roles').where({ code: 'HR_PAYROLL_MANAGER' }).first();
    const payrollUserRole = await db('roles').where({ code: 'HR_PAYROLL_USER' }).first();
    const hrMgrRole = await db('roles').where({ code: 'HR_MANAGER' }).first();
    const empRole = await db('roles').where({ code: 'EMPLOYEE' }).first();

    // 3. Ensure test Department & Job Position
    let dept = await db('departments').where({ code: 'ENG_P10' }).first();
    if (!dept) {
      const [id] = await db('departments').insert({
        name: 'Engineering P10',
        code: 'ENG_P10',
        description: 'Engineering Dept for Phase 10'
      });
      dept = { id, code: 'ENG_P10' };
    }

    let pos = await db('job_positions').where({ code: 'DEV_P10' }).first();
    if (!pos) {
      const [id] = await db('job_positions').insert({
        department_id: dept.id,
        title: 'Developer P10',
        code: 'DEV_P10'
      });
      pos = { id, code: 'DEV_P10' };
    }

    // 4. Ensure Working Schedule
    let sched = await db('working_schedules').where({ name: 'Standard P10 40h' }).first();
    if (!sched) {
      const [id] = await db('working_schedules').insert({
        name: 'Standard P10 40h',
        description: 'Standard 40h schedule',
        is_active: true
      });
      sched = { id, name: 'Standard P10 40h' };

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

    // Clean up test data for employees 911, 912, 913
    await db('payslips').whereIn('employee_id', [911, 912, 913]).del();
    await db('payrun_employees').whereIn('employee_id', [911, 912, 913]).del();
    await db('payruns').where('name', 'like', '%P10%').del();
    await db('contracts').whereIn('employee_id', [911, 912, 913]).del();
    await db('users').whereIn('email', [
      'p10_admin@test.com',
      'p10_paymgr@test.com',
      'p10_payuser@test.com',
      'p10_hrmgr@test.com',
      'p10_emp@test.com'
    ]).del();
    await db('employees').whereIn('id', [911, 912, 913]).del();

    // Create Test Employees
    // Employee 911 (Alice) - Active, Has Contract
    await db('employees').insert({
      id: 911,
      employee_code: 'P10EMP911',
      first_name: 'Alice',
      last_name: 'P10',
      email: 'p10_alice@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2022-01-01',
      employment_status: 'active'
    });

    // Employee 912 (Bob) - Active, Has Contract
    await db('employees').insert({
      id: 912,
      employee_code: 'P10EMP912',
      first_name: 'Bob',
      last_name: 'P10',
      email: 'p10_bob@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2022-01-01',
      employment_status: 'active'
    });

    // Employee 913 (Charlie) - Active, NO Contract (for eligibility testing)
    await db('employees').insert({
      id: 913,
      employee_code: 'P10EMP913',
      first_name: 'Charlie',
      last_name: 'P10',
      email: 'p10_charlie@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2022-01-01',
      employment_status: 'active'
    });

    // Create Test Users
    const [adminUserId] = await db('users').insert({
      email: 'p10_admin@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: adminRole.id,
      is_active: true
    });

    const [payMgrUserId] = await db('users').insert({
      email: 'p10_paymgr@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: payrollMgrRole.id,
      is_active: true
    });

    const [payUserUserId] = await db('users').insert({
      email: 'p10_payuser@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: payrollUserRole.id,
      is_active: true
    });

    const [hrMgrUserId] = await db('users').insert({
      email: 'p10_hrmgr@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: hrMgrRole.id,
      is_active: true
    });

    const [empUserId] = await db('users').insert({
      employee_id: 911,
      email: 'p10_emp@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: empRole.id,
      is_active: true
    });

    // Generate Tokens
    adminToken = generateAccessToken({ id: adminUserId, email: 'p10_admin@test.com', role_code: 'ADMIN', role_name: 'Admin' });
    payrollManagerToken = generateAccessToken({ id: payMgrUserId, email: 'p10_paymgr@test.com', role_code: 'HR_PAYROLL_MANAGER', role_name: 'HR Payroll Manager' });
    payrollUserToken = generateAccessToken({ id: payUserUserId, email: 'p10_payuser@test.com', role_code: 'HR_PAYROLL_USER', role_name: 'HR Payroll User' });
    hrManagerToken = generateAccessToken({ id: hrMgrUserId, email: 'p10_hrmgr@test.com', role_code: 'HR_MANAGER', role_name: 'HR Manager' });
    employeeToken = generateAccessToken({ id: empUserId, employee_id: 911, email: 'p10_emp@test.com', role_code: 'EMPLOYEE', role_name: 'Employee' });

    // Setup Salary Structure & Rules
    let testStructure = await db('salary_structures').where({ code: 'P10_STRUCT' }).first();
    if (!testStructure) {
      const [id] = await db('salary_structures').insert({
        name: 'Phase 10 Salary Structure',
        code: 'P10_STRUCT',
        is_active: true
      });
      testStructure = { id, code: 'P10_STRUCT' };

      // Basic rule (50% of wage)
      await db('salary_rules').insert({
        salary_structure_id: testStructure.id,
        category_id: 1,
        name: 'Basic Salary',
        code: 'BASIC',
        sequence: 1,
        calculation_type: 'percentage',
        value: 50.00,
        formula_expression: 'contract.wage',
        is_active: true
      });

      // Special Allowance (50% of wage)
      await db('salary_rules').insert({
        salary_structure_id: testStructure.id,
        category_id: 2,
        name: 'Special Allowance',
        code: 'SA',
        sequence: 2,
        calculation_type: 'percentage',
        value: 50.00,
        formula_expression: 'contract.wage',
        is_active: true
      });

      // Gross (BASIC + SA)
      await db('salary_rules').insert({
        salary_structure_id: testStructure.id,
        category_id: 3,
        name: 'Gross Salary',
        code: 'GROSS',
        sequence: 10,
        calculation_type: 'formula',
        formula_expression: 'BASIC + SA',
        is_active: true
      });

      // Tax ($200)
      await db('salary_rules').insert({
        salary_structure_id: testStructure.id,
        category_id: 4,
        name: 'Tax Deduction',
        code: 'TAX',
        sequence: 20,
        calculation_type: 'fixed',
        value: 200.00,
        is_active: true
      });

      // Net (GROSS - TAX)
      await db('salary_rules').insert({
        salary_structure_id: testStructure.id,
        category_id: 5,
        name: 'Net Salary',
        code: 'NET',
        sequence: 100,
        calculation_type: 'formula',
        formula_expression: 'GROSS - TAX',
        is_active: true
      });
    }

    // Create Active Contracts for Employee 911 ($80,000) and Employee 912 ($90,000)
    await db('contracts').insert({
      employee_id: 911,
      contract_number: 'CNT-P10-911',
      start_date: '2026-01-01',
      end_date: null,
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      salary_structure_id: testStructure.id,
      wage: 80000.00,
      employment_type: 'full_time',
      status: 'active'
    });

    await db('contracts').insert({
      employee_id: 912,
      contract_number: 'CNT-P10-912',
      start_date: '2026-01-01',
      end_date: null,
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      salary_structure_id: testStructure.id,
      wage: 90000.00,
      employment_type: 'full_time',
      status: 'active'
    });

    // =========================================================================
    // 1. STEP 1: QUERY ELIGIBLE EMPLOYEES
    // =========================================================================
    console.log('--- 1. Step 1: Query Eligible Employees ---');
    {
      const res = await makeRequest('/payruns/eligible-employees', {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` },
        body: JSON.stringify({
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          salary_structure_id: testStructure.id
        })
      });

      assert(res.status === 200, 'POST /api/payruns/eligible-employees returns 200 OK');
      assert(res.data.success === true, 'Response success is true');
      const data = res.data.data;
      assert(data.eligible_count >= 2, 'Found at least 2 eligible employees (911 & 912)');

      const emp911 = data.employees.find(e => e.id === 911);
      const emp913 = data.employees.find(e => e.id === 913);

      assert(emp911 && emp911.is_eligible === true, 'Employee 911 (Alice) marked is_eligible: true');
      assert(emp911.contract.contract_number === 'CNT-P10-911', 'Contract details attached');
      assert(emp913 && emp913.is_eligible === false, 'Employee 913 (Charlie) marked is_eligible: false (no contract)');
      assert(emp913.ineligibility_reason !== null, 'Ineligibility reason provided');
    }

    // =========================================================================
    // 2. STEP 2: CREATE PAYRUN (DRAFT STATUS)
    // =========================================================================
    console.log('\n--- 2. Step 2: Create Payrun in DRAFT Status ---');
    let createdPayrunId;
    {
      // Attempt to create payrun with ineligible employee 913 -> should fail
      const failRes = await makeRequest('/payruns', {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` },
        body: JSON.stringify({
          name: 'PAYRUN-P10-OCT-FAIL',
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          employee_ids: [911, 913] // 913 is invalid
        })
      });

      assert(failRes.status === 400, 'Payrun creation with ineligible employee rejected with 400 Bad Request');
      assert(failRes.data.code === 'EMPLOYEE_ELIGIBILITY_ERROR', 'Returns code EMPLOYEE_ELIGIBILITY_ERROR');

      // Create with valid employee 911
      const createRes = await makeRequest('/payruns', {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` },
        body: JSON.stringify({
          name: 'PAYRUN-P10-OCT-2026',
          salary_structure_id: testStructure.id,
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          employee_ids: [911]
        })
      });

      assert(createRes.status === 201, 'POST /api/payruns creates payrun (201 Created)');
      assert(createRes.data.success === true, 'Payrun created successfully');
      createdPayrunId = createRes.data.data.id;
      assert(createRes.data.data.status === 'draft', 'Payrun initial status is DRAFT');
      assert(createRes.data.data.employees.length === 1, 'Assigned 1 employee');
      assert(createRes.data.data.employees[0].status === 'pending', 'Employee status is pending');
    }

    // =========================================================================
    // 3. EMPLOYEE MANAGEMENT IN DRAFT PAYRUN
    // =========================================================================
    console.log('\n--- 3. Add & Remove Employees in DRAFT Payrun ---');
    {
      // Add Employee 912
      const addRes = await makeRequest(`/payruns/${createdPayrunId}/employees`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` },
        body: JSON.stringify({
          employee_ids: [912]
        })
      });

      assert(addRes.status === 200, 'POST /api/payruns/:id/employees returns 200 OK');
      assert(addRes.data.data.employees.length === 2, 'Employees count updated to 2');

      // Remove Employee 912
      const delRes = await makeRequest(`/payruns/${createdPayrunId}/employees/912`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });

      assert(delRes.status === 200, 'DELETE /api/payruns/:id/employees/:empId returns 200 OK');
      assert(delRes.data.data.employees.length === 1, 'Employee 912 removed (count back to 1)');

      // Re-add Employee 912 for subsequent full tests
      await makeRequest(`/payruns/${createdPayrunId}/employees`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` },
        body: JSON.stringify({ employee_ids: [912] })
      });
    }

    // =========================================================================
    // 4. ACTION: COMPUTE PAYRUN
    // =========================================================================
    console.log('\n--- 4. Action: Compute Payrun ---');
    {
      const compRes = await makeRequest(`/payruns/${createdPayrunId}/compute`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });

      assert(compRes.status === 200, 'POST /api/payruns/:id/compute returns 200 OK');
      assert(compRes.data.data.status === 'computed', 'Payrun status transitions to COMPUTED');
      assert(compRes.data.data.computed_at !== null, 'computed_at timestamp recorded');
      assert(compRes.data.data.summary.computed_count === 2, 'All 2 employees successfully computed');
      assert(compRes.data.data.summary.error_count === 0, '0 computation errors');
    }

    // =========================================================================
    // 5. ACTION: VALIDATE PAYRUN & DUPLICATE CHECKS
    // =========================================================================
    console.log('\n--- 5. Action: Validate Payrun & Duplicate Protection ---');
    {
      // HR Payroll User cannot validate (Must be HR Payroll Manager or Admin)
      const userValRes = await makeRequest(`/payruns/${createdPayrunId}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });
      assert(userValRes.status === 403, 'HR Payroll User blocked from validating payrun (403 Forbidden)');

      // HR Payroll Manager validates payrun -> SUCCESS
      const mgrValRes = await makeRequest(`/payruns/${createdPayrunId}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` }
      });

      assert(mgrValRes.status === 200, 'HR Payroll Manager validates payrun (200 OK)');
      assert(mgrValRes.data.data.status === 'validated', 'Payrun status transitions to VALIDATED');
      assert(mgrValRes.data.data.validated_at !== null, 'validated_at timestamp recorded');

      // Duplicate Check: Attempt to create another payrun for Alice (911) in overlapping October 2026
      const dupRes = await makeRequest('/payruns', {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` },
        body: JSON.stringify({
          name: 'PAYRUN-P10-OCT-DUPLICATE',
          salary_structure_id: testStructure.id,
          period_start: '2026-10-01',
          period_end: '2026-10-31',
          employee_ids: [911]
        })
      });

      assert(dupRes.status === 400, 'Duplicate payrun for employee in same period blocked during creation');
      assert(dupRes.data.code === 'EMPLOYEE_ELIGIBILITY_ERROR', 'Rejection code confirms duplicate protection');
    }

    // =========================================================================
    // 6. ACTION: MARK PAID & STATE IMMUTABILITY
    // =========================================================================
    console.log('\n--- 6. Action: Mark Paid & State Immutability ---');
    {
      // HR Payroll User cannot mark paid
      const userPaidRes = await makeRequest(`/payruns/${createdPayrunId}/mark-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });
      assert(userPaidRes.status === 403, 'HR Payroll User blocked from marking payrun paid (403 Forbidden)');

      // HR Payroll Manager marks paid -> SUCCESS
      const paidRes = await makeRequest(`/payruns/${createdPayrunId}/mark-paid`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` }
      });

      assert(paidRes.status === 200, 'HR Payroll Manager marks payrun paid (200 OK)');
      assert(paidRes.data.data.status === 'paid', 'Payrun status transitions to PAID');
      assert(paidRes.data.data.paid_at !== null, 'paid_at timestamp recorded');
      assert(paidRes.data.data.summary.paid_count === 2, 'All assigned employees marked paid');

      // Cannot modify or delete a paid payrun
      const modifyRes = await makeRequest(`/payruns/${createdPayrunId}/employees`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` },
        body: JSON.stringify({ employee_ids: [911] })
      });
      assert(modifyRes.status === 400, 'Modifying paid payrun rejected with 400');

      const cancelRes = await makeRequest(`/payruns/${createdPayrunId}/cancel`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` }
      });
      assert(cancelRes.status === 400, 'Cancelling paid payrun rejected with 400');

      const delRes = await makeRequest(`/payruns/${createdPayrunId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${payrollManagerToken}` }
      });
      assert(delRes.status === 400, 'Deleting paid payrun rejected with 400');
    }

    // =========================================================================
    // 7. LISTING, FILTERING & RBAC RESTRICTIONS
    // =========================================================================
    console.log('\n--- 7. Listing, Filtering & RBAC Restrictions ---');
    {
      // GET /api/payruns
      const listRes = await makeRequest('/payruns', {
        method: 'GET',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });
      assert(listRes.status === 200, 'GET /api/payruns returns 200 OK');
      assert(listRes.data.data.length >= 1, 'Payrun listing returned records');
      assert(listRes.data.data[0].employee_counts !== undefined, 'Employee counts summary included in listing');

      // Standard HR Manager (no payroll access) -> 403 Forbidden
      const hrMgrRes = await makeRequest('/payruns', {
        method: 'GET',
        headers: { Authorization: `Bearer ${hrManagerToken}` }
      });
      assert(hrMgrRes.status === 403, 'HR Manager role blocked from Payruns (403 Forbidden)');

      // Standard Employee -> 403 Forbidden
      const empRes = await makeRequest('/payruns', {
        method: 'GET',
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      assert(empRes.status === 403, 'Employee role blocked from Payruns (403 Forbidden)');

      // Unauthenticated -> 401 Unauthorized
      const unauthRes = await makeRequest('/payruns', {
        method: 'GET'
      });
      assert(unauthRes.status === 401, 'Unauthenticated request returns 401 Unauthorized');
    }

    console.log('\n======================================================');
    console.log(`📊 PHASE 10 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
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
server = app.listen(5094, async () => {
  console.log('🧪 Phase 10 Test Server running on port 5094');
  await runTests();
});
