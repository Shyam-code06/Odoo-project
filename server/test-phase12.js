/**
 * Automated Test Suite - Phase 12: Dashboard & Reporting Module
 */

import dotenv from 'dotenv';
dotenv.config();

// Ensure test port
process.env.PORT = '5092';

import app from './index.js';
import { db } from './src/models/index.js';
import { seedRbac } from './src/config/seedRbac.js';
import { generateAccessToken } from './src/utils/tokens.js';

let server;
const BASE_URL = 'http://127.0.0.1:5092/api';

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
  console.log('🧪 ================= STARTING PHASE 12 TESTS: DASHBOARD & REPORTING ================= 🧪\n');

  try {
    // 1. Seed RBAC
    await seedRbac();

    // 2. Fetch Roles
    const adminRole = await db('roles').where({ code: 'ADMIN' }).first();
    const payMgrRole = await db('roles').where({ code: 'HR_PAYROLL_MANAGER' }).first();
    const payUserRole = await db('roles').where({ code: 'HR_PAYROLL_USER' }).first();
    const hrMgrRole = await db('roles').where({ code: 'HR_MANAGER' }).first();
    const empRole = await db('roles').where({ code: 'EMPLOYEE' }).first();

    // 3. Setup test Department & Position
    let dept = await db('departments').where({ code: 'ENG_P12' }).first();
    if (!dept) {
      const [id] = await db('departments').insert({
        name: 'Engineering P12',
        code: 'ENG_P12',
        description: 'Engineering Dept for Phase 12'
      });
      dept = { id, code: 'ENG_P12' };
    }

    let pos = await db('job_positions').where({ code: 'DEV_P12' }).first();
    if (!pos) {
      const [id] = await db('job_positions').insert({
        department_id: dept.id,
        title: 'Developer P12',
        code: 'DEV_P12'
      });
      pos = { id, code: 'DEV_P12' };
    }

    // 4. Clean up existing test data
    await db('payslip_lines').whereIn('payslip_id', function() {
      this.select('id').from('payslips').whereIn('employee_id', [931, 932]);
    }).del();
    await db('payslips').whereIn('employee_id', [931, 932]).del();
    await db('payrun_employees').whereIn('employee_id', [931, 932]).del();
    await db('payruns').where('name', 'like', '%P12%').del();
    await db('attendance').whereIn('employee_id', [931, 932]).del();
    await db('time_off_requests').whereIn('employee_id', [931, 932]).del();
    await db('time_off_allocations').whereIn('employee_id', [931, 932]).del();
    await db('contracts').whereIn('employee_id', [931, 932]).del();
    await db('users').whereIn('email', [
      'p12_admin@test.com',
      'p12_paymgr@test.com',
      'p12_payuser@test.com',
      'p12_hrmgr@test.com',
      'p12_emp@test.com'
    ]).del();
    await db('employees').whereIn('id', [931, 932]).del();

    // 5. Create Test Employees
    await db('employees').insert({
      id: 931,
      employee_code: 'P12EMP931',
      first_name: 'Alice',
      last_name: 'Dashboard',
      email: 'p12_emp@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      joining_date: '2023-01-15',
      employment_status: 'active'
    });

    await db('employees').insert({
      id: 932,
      employee_code: 'P12EMP932',
      first_name: 'Bob',
      last_name: 'Dashboard',
      email: 'p12_bob@test.com',
      department_id: dept.id,
      job_position_id: pos.id,
      joining_date: '2023-03-20',
      employment_status: 'inactive'
    });

    // 6. Create Test Users
    const [adminUserId] = await db('users').insert({
      email: 'p12_admin@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: adminRole.id,
      is_active: true
    });

    const [payMgrUserId] = await db('users').insert({
      email: 'p12_paymgr@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: payMgrRole.id,
      is_active: true
    });

    const [payUserUserId] = await db('users').insert({
      email: 'p12_payuser@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: payUserRole.id,
      is_active: true
    });

    const [hrMgrUserId] = await db('users').insert({
      email: 'p12_hrmgr@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: hrMgrRole.id,
      is_active: true
    });

    const [empUserId] = await db('users').insert({
      employee_id: 931,
      email: 'p12_emp@test.com',
      password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
      role_id: empRole.id,
      is_active: true
    });

    // Generate Tokens
    adminToken = generateAccessToken({ id: adminUserId, email: 'p12_admin@test.com', role_code: 'ADMIN', role_name: 'Admin' });
    payrollManagerToken = generateAccessToken({ id: payMgrUserId, email: 'p12_paymgr@test.com', role_code: 'HR_PAYROLL_MANAGER', role_name: 'HR Payroll Manager' });
    payrollUserToken = generateAccessToken({ id: payUserUserId, email: 'p12_payuser@test.com', role_code: 'HR_PAYROLL_USER', role_name: 'HR Payroll User' });
    hrManagerToken = generateAccessToken({ id: hrMgrUserId, email: 'p12_hrmgr@test.com', role_code: 'HR_MANAGER', role_name: 'HR Manager' });
    employeeToken = generateAccessToken({ id: empUserId, employee_id: 931, email: 'p12_emp@test.com', role_code: 'EMPLOYEE', role_name: 'Employee' });

    // 7. Seed Sample Records for Dashboard (Attendance, Leave, Contract, Payslips)
    // Contract for 931 ($110,000)
    await db('contracts').insert({
      employee_id: 931,
      contract_number: 'CNT-P12-931',
      start_date: '2026-01-01',
      end_date: null,
      department_id: dept.id,
      job_position_id: pos.id,
      wage: 110000.00,
      employment_type: 'full_time',
      status: 'active'
    });

    // Attendance records for December 2026
    await db('attendance').insert([
      { employee_id: 931, attendance_date: '2026-12-01', check_in: '2026-12-01 09:00:00', check_out: '2026-12-01 17:00:00', worked_minutes: 480, status: 'present' },
      { employee_id: 931, attendance_date: '2026-12-02', check_in: '2026-12-02 09:30:00', check_out: '2026-12-02 17:00:00', worked_minutes: 450, status: 'late' },
      { employee_id: 931, attendance_date: '2026-12-03', check_in: '2026-12-03 09:00:00', check_out: '2026-12-03 13:00:00', worked_minutes: 240, status: 'half_day' }
    ]);

    // Leave Allocation and Requests
    let leaveType = await db('time_off_types').where({ code: 'PL_P12' }).first();
    if (!leaveType) {
      const [id] = await db('time_off_types').insert({
        name: 'Paid Leave P12',
        code: 'PL_P12',
        unit: 'days',
        requires_allocation: true,
        requires_approval: true,
        is_paid: true,
        is_active: true
      });
      leaveType = { id, code: 'PL_P12' };
    }

    const [allocId] = await db('time_off_allocations').insert({
      employee_id: 931,
      time_off_type_id: leaveType.id,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      allocated_amount: 20.00,
      used_amount: 3.00,
      status: 'approved'
    });

    await db('time_off_requests').insert([
      { employee_id: 931, time_off_type_id: leaveType.id, allocation_id: allocId, start_date: '2026-12-10', end_date: '2026-12-11', duration: 2.00, status: 'approved' },
      { employee_id: 931, time_off_type_id: leaveType.id, allocation_id: allocId, start_date: '2026-12-24', end_date: '2026-12-24', duration: 1.00, status: 'pending' }
    ]);

    // Seed a Payslip
    await db('payslips').insert({
      employee_id: 931,
      period_start: '2026-12-01',
      period_end: '2026-12-31',
      gross_salary: 110000.00,
      total_deductions: 5000.00,
      net_salary: 105000.00,
      status: 'paid'
    });

    // =========================================================================
    // 1. LIVE DASHBOARD SUMMARY METRICS
    // =========================================================================
    console.log('--- 1. Live Dashboard Summary Metrics ---');
    {
      const res = await makeRequest('/dashboard/summary?date_from=2026-12-01&date_to=2026-12-31', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert(res.status === 200, 'GET /api/dashboard/summary returns 200 OK');
      assert(res.data.success === true, 'Response success is true');
      const data = res.data.data;

      // Headcount
      assert(data.headcount.total >= 2, 'Total headcount aggregated');
      assert(data.headcount.active >= 1, 'Active headcount count accurate');
      assert(data.headcount.inactive >= 1, 'Inactive headcount count accurate');

      // Department distribution
      assert(data.department_distribution.length >= 1, 'Department distribution included');
      const engDept = data.department_distribution.find(d => d.department_name === 'Engineering P12');
      assert(engDept && engDept.employee_count >= 1, 'Engineering P12 department employee count aggregated');

      // Attendance summary
      assert(data.attendance_summary.total_records >= 3, 'Attendance records aggregated in period');
      assert(data.attendance_summary.present >= 1, 'Present count tracked');
      assert(data.attendance_summary.late >= 1, 'Late count tracked');
      assert(data.attendance_summary.half_day >= 1, 'Half-day count tracked');
      assert(data.attendance_summary.total_worked_hours > 15, 'Total worked hours computed');

      // Time-off summary
      assert(data.time_off_summary.pending_requests >= 1, 'Pending leave requests count accurate');
      assert(data.time_off_summary.approved_requests_period >= 1, 'Approved leave requests in period aggregated');

      // Payroll summary
      assert(data.payroll_summary.total_gross_expenditure >= 110000, 'Total gross expenditure aggregated');
      assert(data.payroll_summary.total_net_disbursed >= 105000, 'Total net disbursed aggregated');

      // Salary trends & Department expenditure
      assert(Array.isArray(data.salary_trends), 'Salary trends array returned');
      assert(Array.isArray(data.department_salary_expenditure), 'Department salary expenditure array returned');

      // Operational alerts
      assert(Array.isArray(data.operational_alerts), 'Operational alerts array returned');
      const pendingAlert = data.operational_alerts.find(a => a.category === 'TIME_OFF');
      assert(pendingAlert !== undefined, 'Pending leave operational alert generated');
    }

    // =========================================================================
    // 2. DASHBOARD FILTERING & VALIDATION
    // =========================================================================
    console.log('\n--- 2. Dashboard Filtering & Validation ---');
    {
      // Filter by department
      const deptRes = await makeRequest(`/dashboard/summary?department_id=${dept.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(deptRes.status === 200, 'GET /api/dashboard/summary with department filter returns 200');

      // Invalid date range (date_to < date_from)
      const invalidRes = await makeRequest('/dashboard/summary?date_from=2026-12-31&date_to=2026-12-01', {
        method: 'GET',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert(invalidRes.status === 400, 'Invalid date range returns 400 Bad Request');
    }

    // =========================================================================
    // 3. EMPLOYEE SELF-SERVICE DASHBOARD
    // =========================================================================
    console.log('\n--- 3. Employee Self-Service Dashboard ---');
    {
      const empRes = await makeRequest('/dashboard/my', {
        method: 'GET',
        headers: { Authorization: `Bearer ${employeeToken}` }
      });

      assert(empRes.status === 200, 'GET /api/dashboard/my returns 200 OK');
      const empData = empRes.data.data;
      assert(empData.employee.id === 931, 'Employee profile matches Alice (931)');
      assert(empData.active_contract.wage === 110000, 'Active contract wage attached');
      assert(empData.leave_balances.length >= 1, 'Leave balances attached');
      assert(empData.leave_balances[0].available_balance === 17, 'Available leave balance computed (20 - 3 = 17)');
      assert(empData.recent_payslips.length >= 1, 'Recent payslips returned');
    }

    // =========================================================================
    // 4. STRUCTURED REPORTING APIS
    // =========================================================================
    console.log('\n--- 4. Structured Reporting APIs ---');
    {
      // 1. Employee Report
      const empReportRes = await makeRequest(`/reports/employees?department_id=${dept.id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${hrManagerToken}` }
      });
      assert(empReportRes.status === 200, 'GET /api/reports/employees returns 200 OK');
      assert(empReportRes.data.data.summary.total_count >= 2, 'Employee report includes headcount summary');
      assert(empReportRes.data.data.data.length >= 2, 'Employee report data rows populated');

      // 2. Attendance Report
      const attReportRes = await makeRequest('/reports/attendance?date_from=2026-12-01&date_to=2026-12-31', {
        method: 'GET',
        headers: { Authorization: `Bearer ${hrManagerToken}` }
      });
      assert(attReportRes.status === 200, 'GET /api/reports/attendance returns 200 OK');
      assert(attReportRes.data.data.total_employees_reported >= 1, 'Attendance report generated for employees');
      const aliceAtt = attReportRes.data.data.data.find(r => r.employee_id === 931);
      assert(aliceAtt && aliceAtt.total_worked_hours > 15, 'Alice attendance statistics accurate');

      // 3. Time-Off Report
      const timeOffReportRes = await makeRequest('/reports/time-off?date_from=2026-12-01&date_to=2026-12-31', {
        method: 'GET',
        headers: { Authorization: `Bearer ${hrManagerToken}` }
      });
      assert(timeOffReportRes.status === 200, 'GET /api/reports/time-off returns 200 OK');
      assert(timeOffReportRes.data.data.summary.total_requests >= 2, 'Time off report includes total requests');

      // 4. Payroll Report
      const payrollReportRes = await makeRequest('/reports/payroll', {
        method: 'GET',
        headers: { Authorization: `Bearer ${payrollUserToken}` }
      });
      assert(payrollReportRes.status === 200, 'GET /api/reports/payroll returns 200 OK');
      assert(payrollReportRes.data.data.summary.total_gross_expenditure >= 110000, 'Payroll report gross total accurate');
    }

    // =========================================================================
    // 5. RBAC & PERMISSION BOUNDARIES
    // =========================================================================
    console.log('\n--- 5. RBAC & Permission Boundaries ---');
    {
      // Employee role blocked from main dashboard summary -> 403 Forbidden
      const empSummaryRes = await makeRequest('/dashboard/summary', {
        method: 'GET',
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      assert(empSummaryRes.status === 403, 'Employee role blocked from main dashboard summary (403 Forbidden)');

      // Employee role blocked from reports -> 403 Forbidden
      const empReportRes = await makeRequest('/reports/employees', {
        method: 'GET',
        headers: { Authorization: `Bearer ${employeeToken}` }
      });
      assert(empReportRes.status === 403, 'Employee role blocked from employee reports (403 Forbidden)');

      // HR Manager role blocked from financial Payroll Report -> 403 Forbidden
      const hrPayReportRes = await makeRequest('/reports/payroll', {
        method: 'GET',
        headers: { Authorization: `Bearer ${hrManagerToken}` }
      });
      assert(hrPayReportRes.status === 403, 'HR Manager role blocked from financial Payroll Report (403 Forbidden)');

      // HR Payroll Manager & Admin have full access -> 200 OK
      const adminPayReportRes = await makeRequest('/reports/payroll', {
        method: 'GET',
        headers: { Authorization: `Bearer ${payrollManagerToken}` }
      });
      assert(adminPayReportRes.status === 200, 'HR Payroll Manager has access to Payroll Report (200 OK)');
    }

    console.log('\n======================================================');
    console.log(`📊 PHASE 12 TEST RESULTS: ${passedTests} Passed, ${failedTests} Failed`);
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
server = app.listen(5092, async () => {
  console.log('🧪 Phase 12 Test Server running on port 5092');
  await runTests();
});
