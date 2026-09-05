/**
 * Automated Test Suite - Phase 11: Payslip Generation & Email Distribution
 */

import dotenv from 'dotenv';
dotenv.config();

// Ensure test port
process.env.PORT = '5093';

import app from './index.js';
import { db } from './src/models/index.js';
import { seedRbac } from './src/config/seedRbac.js';
import { generateAccessToken } from './src/utils/tokens.js';
import payrunService from './src/services/payrunService.js';

let server;
const BASE_URL = 'http://127.0.0.1:5093/api';

let adminToken;
let payrollManagerToken;
let payrollUserToken;
let hrManagerToken;
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
  console.log('🧪 ================= STARTING PHASE 11 TESTS: PAYSLIPS & EMAIL DISTRIBUTION ================= 🧪\n');

  try {
    // 1. Seed RBAC
    await seedRbac();

    // 2. Fetch Roles
    const adminRole = await db('roles').where({ code: 'ADMIN' }).first();
    const payMgrRole = await db('roles').where({ code: 'HR_PAYROLL_MANAGER' }).first();
    const payUserRole = await db('roles').where({ code: 'HR_PAYROLL_USER' }).first();
    const hrMgrRole = await db('roles').where({ code: 'HR_MANAGER' }).first();
    const empRole = await db('roles').where({ code: 'EMPLOYEE' }).first();

    // 3. Ensure test Department & Job Position
    let dept = await db('departments').where({ code: 'ENG_P11' }).first();
    if (!dept) {
      const [id] = await db('departments').insert({
        name: 'Engineering P11',
        code: 'ENG_P11',
        description: 'Engineering Dept for Phase 11'
      });
      dept = { id, code: 'ENG_P11' };
    }

    let pos = await db('job_positions').where({ code: 'DEV_P11' }).first();
    if (!pos) {
      const [id] = await db('job_positions').insert({
        department_id: dept.id,
        title: 'Developer P11',
        code: 'DEV_P11'
      });
      pos = { id, code: 'DEV_P11' };
    }

    // 4. Ensure Working Schedule
    let sched = await db('working_schedules').where({ name: 'Standard P11 40h' }).first();
    if (!sched) {
      const [id] = await db('working_schedules').insert({
        name: 'Standard P11 40h',
        description: 'Standard 40h schedule',
        is_active: true
      });
      sched = { id, name: 'Standard P11 40h' };

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

    // Clean up test data for employees 921 & 922
    await db('payslip_lines').whereIn('payslip_id', function() {
      this.select('id').from('payslips').whereIn('employee_id', [921, 922]);
    }).del();
    await db('payslips').whereIn('employee_id', [921, 922]).del();
    await db('payrun_employees').whereIn('employee_id', [921, 922]).del();
    await db('payruns').where('name', 'like', '%P11%').del();
    await db('contracts').whereIn('employee_id', [921, 922]).del();
    await db('users').whereIn('email', [
      'p11_admin@test.com',
      'p11_paymgr@test.com',
      'p11_payuser@test.com',
      'p11_hrmgr@test.com',
      'p11_alice@test.com',
      'p11_bob@test.com'
    ]).del();
    await db('employees').whereIn('id', [921, 922]).del();

    // Create Test Employees
    await db('employees').insert({
      id: 921,
      employee_code: 'P11EMP921',
      first_name: 'Alice',
      last_name: 'Payslip',
      email: 'p11_alice@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2022-01-01',
      employment_status: 'active'
    });

    await db('employees').insert({
      id: 922,
      employee_code: 'P11EMP922',
      first_name: 'Bob',
      last_name: 'Payslip',
      email: 'p11_bob@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      joining_date: '2022-01-01',
      employment_status: 'active'
    });

    // Create Users
    const [adminUserId] = await db('users').insert({
      email: 'p11_admin@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: adminRole.id,
      is_active: true
    });

    const [payMgrUserId] = await db('users').insert({
      email: 'p11_paymgr@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: payMgrRole.id,
      is_active: true
    });

    const [payUserUserId] = await db('users').insert({
      email: 'p11_payuser@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: payUserRole.id,
      is_active: true
    });

    const [hrMgrUserId] = await db('users').insert({
      email: 'p11_hrmgr@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: hrMgrRole.id,
      is_active: true
    });

    const [emp1UserId] = await db('users').insert({
      employee_id: 921,
      email: 'p11_alice@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: empRole.id,
      is_active: true
    });

    const [emp2UserId] = await db('users').insert({
      employee_id: 922,
      email: 'p11_bob@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: empRole.id,
      is_active: true
    });

    // Generate Tokens
    adminToken = generateAccessToken({ id: adminUserId, email: 'p11_admin@test.com', role_code: 'ADMIN', role_name: 'Admin' });
    payrollManagerToken = generateAccessToken({ id: payMgrUserId, email: 'p11_paymgr@test.com', role_code: 'HR_PAYROLL_MANAGER', role_name: 'HR Payroll Manager' });
    payrollUserToken = generateAccessToken({ id: payUserUserId, email: 'p11_payuser@test.com', role_code: 'HR_PAYROLL_USER', role_name: 'HR Payroll User' });
    hrManagerToken = generateAccessToken({ id: hrMgrUserId, email: 'p11_hrmgr@test.com', role_code: 'HR_MANAGER', role_name: 'HR Manager' });
    employee1Token = generateAccessToken({ id: emp1UserId, employee_id: 921, email: 'p11_alice@test.com', role_code: 'EMPLOYEE', role_name: 'Employee' });
    employee2Token = generateAccessToken({ id: emp2UserId, employee_id: 922, email: 'p11_bob@test.com', role_code: 'EMPLOYEE', role_name: 'Employee' });

    // Setup Salary Structure & Rules
    let testStructure = await db('salary_structures').where({ code: 'P11_STRUCT' }).first();
    if (!testStructure) {
      const [id] = await db('salary_structures').insert({
        name: 'Phase 11 Salary Structure',
        code: 'P11_STRUCT',
        is_active: true
      });
      testStructure = { id, code: 'P11_STRUCT' };

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

      // Tax ($300)
      await db('salary_rules').insert({
        salary_structure_id: testStructure.id,
        category_id: 4,
        name: 'Tax Deduction',
        code: 'TAX',
        sequence: 20,
        calculation_type: 'fixed',
        value: 300.00,
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

    // Create Active Contracts for Employee 921 ($100,000) and Employee 922 ($120,000)
    await db('contracts').insert({
      employee_id: 921,
      contract_number: 'CNT-P11-921',
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

    await db('contracts').insert({
      employee_id: 922,
      contract_number: 'CNT-P11-922',
      start_date: '2026-01-01',
      end_date: null,
      department_id: dept.id,
      job_position_id: pos.id,
      working_schedule_id: sched.id,
      salary_structure_id: testStructure.id,
      wage: 120000.00,
      employment_type: 'full_time',
      status: 'active'
    });

    // Create and Compute a Payrun for November 2026
    const payrun = await payrunService.createPayrun(adminUserId, {
      name: 'PAYRUN-P11-NOV-2026',
      salary_structure_id: testStructure.id,
      period_start: '2026-11-01',
      period_end: '2026-11-30',
      employee_ids: [921, 922]
    });

    const computedPayrun = await payrunService.computePayrun(payrun.id);
    const payrunId = computedPayrun.id;

    // =========================================================================
    // 1. PAYSLIP GENERATION FROM COMPUTED PAYRUN
    // =========================================================================
    console.log('--- 1. Payslip Generation from Computed Payrun ---');
    let generatedPayslips = [];
    {
      const genRes = await makeRequest('/payslips/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollUserToken}` },
        body: JSON.stringify({ payrun_id: payrunId })
      });

      assert(genRes.status === 201, 'POST /api/payslips/generate returns 201 Created');
      assert(genRes.data.success === true, 'Response success is true');
      assert(genRes.data.data.generated_count === 2, 'Generated 2 payslips');
      generatedPayslips = genRes.data.data.payslips;

      // Verify Database records exist
      const dbPayslips = await db('payslips').where({ payrun_id: payrunId });
      assert(dbPayslips.length === 2, '2 payslips stored in database');

      const p1 = dbPayslips.find(p => p.employee_id === 921);
      assert(p1 && Number(p1.gross_salary) === 100000, 'Employee 921 Gross salary is $100,000');
      assert(Number(p1.total_deductions) === 300, 'Employee 921 Total deductions is $300');
      assert(Number(p1.net_salary) === 99700, 'Employee 921 Net salary is $99,700');

      // Verify payslip_lines
      const lines = await db('payslip_lines').where({ payslip_id: p1.id });
      assert(lines.length === 5, 'Stored 5 salary-rule lines snapshot for Employee 921');
      const basicLine = lines.find(l => l.code === 'BASIC');
      assert(basicLine && Number(basicLine.amount) === 50000, 'BASIC line amount is $50,000');
    }

    const alicePayslipId = generatedPayslips.find(p => p.employee_id === 921).id;
    const bobPayslipId = generatedPayslips.find(p => p.employee_id === 922).id;

    // =========================================================================
    // 2. COMPLETE PAYSLIP DATA FOR FRONTEND PDF RENDERING
    // =========================================================================
    console.log('\n--- 2. Complete Payslip Data for Frontend PDF Rendering ---');
    {
      const res = await makeRequest(`/payslips/${alicePayslipId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });

      assert(res.status === 200, 'GET /api/payslips/:id returns 200 OK');
      const slip = res.data.data;
      assert(slip.employee_first_name === 'Alice', 'Employee name attached');
      assert(slip.employee_code === 'P10EMP911' || slip.employee_code === 'P11EMP921', 'Employee code attached');
      assert(slip.contract_number === 'CNT-P11-921', 'Contract number attached');
      assert(slip.structure_name === 'Phase 11 Salary Structure', 'Salary structure name attached');
      assert(slip.lines.length === 5, 'All 5 breakdown lines included');
      assert(slip.summary_breakdown.earnings.length >= 2, 'Earnings group included');
      assert(slip.summary_breakdown.deductions.length >= 1, 'Deductions group included');
      assert(slip.pdf_path === null, 'pdf_path is left null on backend (rendered on frontend)');
    }

    // =========================================================================
    // 3. RBAC & SELF-SERVICE OWNERSHIP ENFORCEMENT
    // =========================================================================
    console.log('\n--- 3. RBAC & Self-Service Ownership Enforcement ---');
    {
      // Alice can view her own payslips via /api/payslips/my
      const myRes = await makeRequest('/payslips/my', {
        method: 'GET',
        headers: { Authorization: `Bearer ${employee1Token}` }
      });
      assert(myRes.status === 200, 'GET /api/payslips/my returns 200 OK');
      assert(myRes.data.data.length >= 1, 'Returns Alice\'s payslips');

      // Alice can view her own payslip by ID
      const ownRes = await makeRequest(`/payslips/${alicePayslipId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${employee1Token}` }
      });
      assert(ownRes.status === 200, 'Employee can view their own payslip by ID');

      // Bob attempting to view Alice's payslip -> 403 Forbidden
      const unauthorizedRes = await makeRequest(`/payslips/${alicePayslipId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${employee2Token}` }
      });
      assert(unauthorizedRes.status === 403, 'Bob blocked from viewing Alice\'s payslip (403 Forbidden)');
      assert(unauthorizedRes.data.code === 'FORBIDDEN', 'Returns code FORBIDDEN');

      // HR Manager (no payroll access) attempting to generate payslips -> 403 Forbidden
      const hrGenRes = await makeRequest('/payslips/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${hrManagerToken}` },
        body: JSON.stringify({ payrun_id: payrunId })
      });
      assert(hrGenRes.status === 403, 'HR Manager blocked from generating payslips (403 Forbidden)');
    }

    // =========================================================================
    // 4. INDIVIDUAL PAYSLIP EMAIL WITH NODEMAILER
    // =========================================================================
    console.log('\n--- 4. Individual Payslip Email with Nodemailer ---');
    {
      // Mock frontend-generated PDF Base64 string
      const mockPdfBase64 = Buffer.from('%PDF-1.4 Mock Payslip PDF Content').toString('base64');

      const mailRes = await makeRequest(`/payslips/${alicePayslipId}/send-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` },
        body: JSON.stringify({
          pdf_base64: mockPdfBase64,
          pdf_filename: 'Alice_November_2026_Payslip.pdf'
        })
      });

      assert(mailRes.status === 200, 'POST /api/payslips/:id/send-email returns 200 OK');
      assert(mailRes.data.success === true, 'Email dispatched successfully');

      // Verify email_sent_at timestamp is recorded in database
      const updatedPayslip = await db('payslips').where({ id: alicePayslipId }).first();
      assert(updatedPayslip.email_sent_at !== null, 'email_sent_at timestamp recorded in database');
    }

    // =========================================================================
    // 5. BULK-SEND PAYRUN PAYSLIPS
    // =========================================================================
    console.log('\n--- 5. Bulk-Send Payrun Payslips ---');
    {
      const bulkRes = await makeRequest('/payslips/bulk-send-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${payrollManagerToken}` },
        body: JSON.stringify({
          payrun_id: payrunId
        })
      });

      assert(bulkRes.status === 200, 'POST /api/payslips/bulk-send-email returns 200 OK');
      const bulkData = bulkRes.data.data;
      assert(bulkData.total_processed === 2, 'Processed 2 payslips');
      assert(bulkData.successful_count === 2, 'All 2 emails successfully sent');
      assert(bulkData.failed_count === 0, '0 email failures');
    }

    console.log('\n======================================================');
    console.log(`📊 PHASE 11 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
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
server = app.listen(5093, async () => {
  console.log('🧪 Phase 11 Test Server running on port 5093');
  await runTests();
});
