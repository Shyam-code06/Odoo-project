/**
 * Automated Test Suite: Payslip PDF Generation (PDFKit) & Payroll Analytics
 */

import dotenv from 'dotenv';
dotenv.config();

process.env.PORT = '5095';

import app from './index.js';
import { db } from './src/models/index.js';
import { seedRbac } from './src/config/seedRbac.js';
import { generateAccessToken } from './src/utils/tokens.js';

let server;
const BASE_URL = 'http://127.0.0.1:5095/api';

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
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType.includes('application/pdf')) {
    const arrayBuf = await response.arrayBuffer();
    data = Buffer.from(arrayBuf);
  } else {
    data = await response.text();
  }

  return { status: response.status, data, headers: response.headers };
};

const runTests = async () => {
  console.log('🧪 ================= STARTING PAYSLIP PDF & PAYROLL ANALYTICS TESTS ================= 🧪\n');

  try {
    // 1. Seed RBAC
    await seedRbac();

    // 2. Fetch Roles
    const adminRole = await db('roles').where({ code: 'ADMIN' }).first();
    const payMgrRole = await db('roles').where({ code: 'HR_PAYROLL_MANAGER' }).first();
    const payUserRole = await db('roles').where({ code: 'HR_PAYROLL_USER' }).first();
    const hrMgrRole = await db('roles').where({ code: 'HR_MANAGER' }).first();
    const empRole = await db('roles').where({ code: 'EMPLOYEE' }).first();

    // 3. Setup test department, positions, employees, structures, and payslips
    let dept1 = await db('departments').where({ code: 'ENG_TEST_PDF' }).first();
    if (!dept1) {
      const [id] = await db('departments').insert({
        name: 'Engineering PDF Dept',
        code: 'ENG_TEST_PDF',
        description: 'Engineering Dept for PDF Tests'
      });
      dept1 = { id, code: 'ENG_TEST_PDF', name: 'Engineering PDF Dept' };
    }

    let dept2 = await db('departments').where({ code: 'HR_TEST_PDF' }).first();
    if (!dept2) {
      const [id] = await db('departments').insert({
        name: 'Human Resources PDF Dept',
        code: 'HR_TEST_PDF',
        description: 'HR Dept for PDF Tests'
      });
      dept2 = { id, code: 'HR_TEST_PDF', name: 'Human Resources PDF Dept' };
    }

    // Employees
    let emp1 = await db('employees').where({ employee_code: 'EMP_PDF_01' }).first();
    if (!emp1) {
      const [id] = await db('employees').insert({
        employee_code: 'EMP_PDF_01',
        first_name: 'Devon',
        last_name: 'Engineer',
        email: 'devon.engineer@testpdf.internal',
        department_id: dept1.id,
        employment_status: 'active',
        joining_date: '2025-01-01'
      });
      emp1 = { id, employee_code: 'EMP_PDF_01' };
    }

    let emp2 = await db('employees').where({ employee_code: 'EMP_PDF_02' }).first();
    if (!emp2) {
      const [id] = await db('employees').insert({
        employee_code: 'EMP_PDF_02',
        first_name: 'Harper',
        last_name: 'Recruiter',
        email: 'harper.recruiter@testpdf.internal',
        department_id: dept2.id,
        employment_status: 'active',
        joining_date: '2025-02-01'
      });
      emp2 = { id, employee_code: 'EMP_PDF_02' };
    }

    // Users
    let userAdmin = await db('users').where({ email: 'admin.pdf@test.internal' }).first();
    if (!userAdmin) {
      const [id] = await db('users').insert({
        email: 'admin.pdf@test.internal',
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role_id: adminRole.id,
        is_active: true
      });
      userAdmin = { id, role_id: adminRole.id };
    }

    let userHrUser = await db('users').where({ email: 'hruser.pdf@test.internal' }).first();
    if (!userHrUser) {
      const [id] = await db('users').insert({
        email: 'hruser.pdf@test.internal',
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role_id: payUserRole.id,
        is_active: true
      });
      userHrUser = { id, role_id: payUserRole.id };
    }

    let userEmp1 = await db('users').where({ email: 'emp1.pdf@test.internal' }).first();
    if (!userEmp1) {
      const [id] = await db('users').insert({
        employee_id: emp1.id,
        email: 'emp1.pdf@test.internal',
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role_id: empRole.id,
        is_active: true
      });
      userEmp1 = { id, employee_id: emp1.id, role_id: empRole.id };
    }

    let userEmp2 = await db('users').where({ email: 'emp2.pdf@test.internal' }).first();
    if (!userEmp2) {
      const [id] = await db('users').insert({
        employee_id: emp2.id,
        email: 'emp2.pdf@test.internal',
        password_hash: '$2a$10$abcdefghijklmnopqrstuvwxyz1234567890',
        role_id: empRole.id,
        is_active: true
      });
      userEmp2 = { id, employee_id: emp2.id, role_id: empRole.id };
    }

    // Tokens
    const adminToken = generateAccessToken(userAdmin.id);
    const hrUserToken = generateAccessToken(userHrUser.id);
    const emp1Token = generateAccessToken(userEmp1.id);
    const emp2Token = generateAccessToken(userEmp2.id);

    // Create test payslips for emp1 and emp2
    const [payslip1Id] = await db('payslips').insert({
      employee_id: emp1.id,
      period_start: '2026-07-01',
      period_end: '2026-07-31',
      gross_salary: 85000.00,
      total_deductions: 8500.00,
      net_salary: 76500.00,
      status: 'paid'
    });

    await db('payslip_lines').insert([
      {
        payslip_id: payslip1Id,
        name: 'Basic Salary',
        code: 'BASIC',
        category: 'BASIC',
        sequence: 1,
        amount: 50000.00,
        quantity: 1,
        rate: 100
      },
      {
        payslip_id: payslip1Id,
        name: 'House Rent Allowance',
        code: 'HRA',
        category: 'ALW',
        sequence: 2,
        amount: 25000.00,
        quantity: 1,
        rate: 50
      },
      {
        payslip_id: payslip1Id,
        name: 'Special Allowance',
        code: 'SA',
        category: 'ALW',
        sequence: 3,
        amount: 10000.00,
        quantity: 1,
        rate: 100
      },
      {
        payslip_id: payslip1Id,
        name: 'Provident Fund',
        code: 'PF',
        category: 'DED',
        sequence: 4,
        amount: 6000.00,
        quantity: 1,
        rate: 12
      },
      {
        payslip_id: payslip1Id,
        name: 'Professional Tax',
        code: 'PT',
        category: 'DED',
        sequence: 5,
        amount: 2500.00,
        quantity: 1,
        rate: 100
      }
    ]);

    const [payslip2Id] = await db('payslips').insert({
      employee_id: emp2.id,
      period_start: '2026-08-01',
      period_end: '2026-08-31',
      gross_salary: 60000.00,
      total_deductions: 5000.00,
      net_salary: 55000.00,
      status: 'generated'
    });

    // Start HTTP Server
    server = app.listen(5095);

    // =========================================================================
    // FEATURE 1: PAYSLIP PDF DOWNLOAD TESTS
    // =========================================================================
    console.log('\n--- Section 1: Feature 1 - Payslip PDF Download (PDFKit) ---');

    // 1. Admin downloads payslip 1 PDF
    const resAdminPdf = await makeRequest(`/payslips/${payslip1Id}/pdf`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminPdf.status === 200, 'Admin can download payslip PDF (200 OK)');
    assert(
      (resAdminPdf.headers.get('content-type') || '').includes('application/pdf'),
      'PDF response has Content-Type: application/pdf'
    );
    assert(
      (resAdminPdf.headers.get('content-disposition') || '').includes('Payslip_'),
      'PDF response includes dynamic attachment Content-Disposition header'
    );
    assert(
      Buffer.isBuffer(resAdminPdf.data) && resAdminPdf.data.slice(0, 5).toString() === '%PDF-',
      'PDF binary stream starts with valid PDF magic bytes (%PDF-)'
    );

    // 2. HR Payroll User downloads payslip 1 PDF
    const resHrPdf = await makeRequest(`/payslips/${payslip1Id}/pdf`, {
      headers: { Authorization: `Bearer ${hrUserToken}` }
    });
    assert(resHrPdf.status === 200, 'HR Payroll User can download payslip PDF (200 OK)');

    // 3. Employee 1 downloads own payslip PDF
    const resEmp1OwnPdf = await makeRequest(`/payslips/${payslip1Id}/pdf`, {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(resEmp1OwnPdf.status === 200, 'Employee can download their own payslip PDF (200 OK)');

    // 4. Employee 2 attempts to download Employee 1 payslip (IDOR Prevention Test)
    const resEmp2IdorPdf = await makeRequest(`/payslips/${payslip1Id}/pdf`, {
      headers: { Authorization: `Bearer ${emp2Token}` }
    });
    assert(resEmp2IdorPdf.status === 403, 'Employee attempting to access another employee payslip PDF is blocked (403 Forbidden)');

    // 5. Invalid/Non-existent payslip ID
    const resNotFoundPdf = await makeRequest('/payslips/999999/pdf', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resNotFoundPdf.status === 404, 'Non-existent payslip ID returns 404 Not Found');

    // =========================================================================
    // FEATURE 2: ADMIN & HR PAYROLL ANALYTICS TESTS
    // =========================================================================
    console.log('\n--- Section 2: Feature 2 - Payroll Analytics APIs & DB Aggregation ---');

    // 6. Admin accesses Salary Cost by Department
    const resAdminDeptCost = await makeRequest('/payroll/analytics/salary-cost-by-department', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminDeptCost.status === 200, 'Admin can access Salary Cost by Department API (200 OK)');
    assert(
      resAdminDeptCost.data.success === true && Array.isArray(resAdminDeptCost.data.data),
      'Salary Cost by Department returns array of department aggregations'
    );
    assert(
      resAdminDeptCost.data.data.some((d) => d.salaryCost > 0 && d.departmentName),
      'Department aggregations contain real department names and positive salary costs'
    );

    // 7. Admin accesses Monthly Net Salary Trends
    const resAdminMonthlyTrend = await makeRequest('/payroll/analytics/monthly-net-salary', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert(resAdminMonthlyTrend.status === 200, 'Admin can access Monthly Net Salary Trends API (200 OK)');
    assert(
      resAdminMonthlyTrend.data.success === true && Array.isArray(resAdminMonthlyTrend.data.data),
      'Monthly Net Salary Trends returns array of monthly historical points'
    );
    assert(
      resAdminMonthlyTrend.data.data.length > 0 && resAdminMonthlyTrend.data.data[0].month,
      'Monthly trends include chronological month identifiers (e.g., YYYY-MM)'
    );

    // 8. HR User accesses Salary Cost & Monthly Trends
    const resHrDeptCost = await makeRequest('/payroll/analytics/salary-cost-by-department', {
      headers: { Authorization: `Bearer ${hrUserToken}` }
    });
    assert(resHrDeptCost.status === 200, 'HR Payroll User can access Salary Cost by Department (200 OK)');

    const resHrMonthlyTrend = await makeRequest('/payroll/analytics/monthly-net-salary', {
      headers: { Authorization: `Bearer ${hrUserToken}` }
    });
    assert(resHrMonthlyTrend.status === 200, 'HR Payroll User can access Monthly Net Salary Trends (200 OK)');

    // =========================================================================
    // SECTION 3: ROLE RESTRICTION & SECURITY TESTS
    // =========================================================================
    console.log('\n--- Section 3: Role Restrictions for Payroll Analytics ---');

    // 9. Employee attempts to access Salary Cost by Department
    const resEmpDeptCost = await makeRequest('/payroll/analytics/salary-cost-by-department', {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(resEmpDeptCost.status === 403, 'Employee is blocked from accessing Salary Cost by Department (403 Forbidden)');

    // 10. Employee attempts to access Monthly Net Salary Trends
    const resEmpMonthlyTrend = await makeRequest('/payroll/analytics/monthly-net-salary', {
      headers: { Authorization: `Bearer ${emp1Token}` }
    });
    assert(resEmpMonthlyTrend.status === 403, 'Employee is blocked from accessing Monthly Net Salary Trends (403 Forbidden)');

    // 11. Unauthenticated request
    const resUnauth = await makeRequest('/payroll/analytics/salary-cost-by-department');
    assert(resUnauth.status === 401, 'Unauthenticated access to analytics is blocked (401 Unauthorized)');

  } catch (error) {
    console.error('Fatal test error:', error);
    failedTests++;
  } finally {
    if (server) {
      server.close();
    }

    console.log('\n=================================================================');
    console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
    console.log('=================================================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
  }
};

runTests();
