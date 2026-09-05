process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
import { seedRbac } from './src/config/seedRbac.js';
import { hashPassword } from './src/utils/password.js';

let server;
const PORT = 5098;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runRbacTests() {
  console.log('🛡️ ================= STARTING RBAC TESTS ================= 🛡️\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Seed RBAC
    await seedRbac();

    // 2. Fetch role IDs
    const roles = await db('roles').select('id', 'code');
    const roleIdMap = {};
    for (const r of roles) {
      if (r.code) roleIdMap[r.code] = r.id;
    }

    const testPassword = 'Password123!';
    const testPasswordHash = await hashPassword(testPassword);

    // 3. Ensure test employees exist (ID 901 and ID 902)
    await db('employees').whereIn('id', [901, 902]).del();
    await db('employees').insert([
      {
        id: 901,
        employee_code: 'TEST901',
        first_name: 'Employee',
        last_name: 'One',
        email: 'emp901@odoo.local',
        joining_date: '2025-01-01',
        employment_status: 'active'
      },
      {
        id: 902,
        employee_code: 'TEST902',
        first_name: 'Employee',
        last_name: 'Two',
        email: 'emp902@odoo.local',
        joining_date: '2025-01-01',
        employment_status: 'active'
      }
    ]);

    // 4. Setup 5 test accounts
    const testAccounts = [
      { email: 'test.emp@odoo.local', role_id: roleIdMap['EMPLOYEE'], employee_id: 901 },
      { email: 'test.hr_mgr@odoo.local', role_id: roleIdMap['HR_MANAGER'], employee_id: null },
      { email: 'test.payroll_usr@odoo.local', role_id: roleIdMap['HR_PAYROLL_USER'], employee_id: null },
      { email: 'test.payroll_mgr@odoo.local', role_id: roleIdMap['HR_PAYROLL_MANAGER'], employee_id: null },
      { email: 'test.admin@odoo.local', role_id: roleIdMap['ADMIN'], employee_id: null }
    ];

    const emails = testAccounts.map((a) => a.email);
    await db('users').whereIn('email', emails).del();

    for (const acc of testAccounts) {
      await db('users').insert({
        email: acc.email,
        password_hash: testPasswordHash,
        role_id: acc.role_id,
        employee_id: acc.employee_id,
        is_active: true
      });
    }

    // 5. Log in each user and obtain access tokens
    const tokens = {};
    for (const acc of testAccounts) {
      const loginRes = await request('POST', '/auth/login', {
        email: acc.email,
        password: testPassword
      });
      tokens[acc.email] = loginRes.body?.data?.tokens?.accessToken;
    }

    const empToken = tokens['test.emp@odoo.local'];
    const hrMgrToken = tokens['test.hr_mgr@odoo.local'];
    const payrollUsrToken = tokens['test.payroll_usr@odoo.local'];
    const payrollMgrToken = tokens['test.payroll_mgr@odoo.local'];
    const adminToken = tokens['test.admin@odoo.local'];

    // -------------------------------------------------------------
    // SCENARIO 1: EMPLOYEE ROLE
    // -------------------------------------------------------------
    console.log('\n--- Scenario 1: Employee Role ---');

    // 1a. Access own employee record (901) -> ALLOW
    const resEmpOwn = await request('GET', '/rbac-test/employees/901', null, {
      Authorization: `Bearer ${empToken}`
    });
    assert(resEmpOwn.status === 200, 'Employee can access their own record (/employees/901)');

    // 1b. Access other employee record (902) -> FORBIDDEN (403)
    const resEmpOther = await request('GET', '/rbac-test/employees/902', null, {
      Authorization: `Bearer ${empToken}`
    });
    assert(resEmpOther.status === 403, 'Employee cannot access other employee record (/employees/902) -> 403');
    assert(resEmpOther.body?.code === 'FORBIDDEN_OWNERSHIP', 'Ownership error code returned for other record');

    // 1c. Attempt to create payrun -> FORBIDDEN (403)
    const resEmpPayrun = await request('POST', '/rbac-test/payruns', {}, {
      Authorization: `Bearer ${empToken}`
    });
    assert(resEmpPayrun.status === 403, 'Employee cannot access payroll/create payrun -> 403');

    // -------------------------------------------------------------
    // SCENARIO 2: HR MANAGER ROLE
    // -------------------------------------------------------------
    console.log('\n--- Scenario 2: HR Manager Role ---');

    // 2a. Access any employee record (901) -> ALLOW
    const resHrMgrEmp = await request('GET', '/rbac-test/employees/901', null, {
      Authorization: `Bearer ${hrMgrToken}`
    });
    assert(resHrMgrEmp.status === 200, 'HR Manager can access any employee record (/employees/901)');

    // 2b. Access HR reports -> ALLOW
    const resHrMgrReports = await request('GET', '/rbac-test/reports/hr', null, {
      Authorization: `Bearer ${hrMgrToken}`
    });
    assert(resHrMgrReports.status === 200, 'HR Manager can access HR reports');

    // 2c. Attempt to create payrun -> FORBIDDEN (403)
    const resHrMgrPayrun = await request('POST', '/rbac-test/payruns', {}, {
      Authorization: `Bearer ${hrMgrToken}`
    });
    assert(resHrMgrPayrun.status === 403, 'HR Manager cannot access payroll/create payrun -> 403');

    // -------------------------------------------------------------
    // SCENARIO 3: HR PAYROLL USER ROLE
    // -------------------------------------------------------------
    console.log('\n--- Scenario 3: HR Payroll User Role ---');

    // 3a. Create payrun -> ALLOW
    const resPayrollUsrPayrun = await request('POST', '/rbac-test/payruns', {}, {
      Authorization: `Bearer ${payrollUsrToken}`
    });
    assert(resPayrollUsrPayrun.status === 200, 'HR Payroll User can create payruns');

    // 3b. Attempt to manage salary structures -> FORBIDDEN (403)
    const resPayrollUsrSalStruct = await request('POST', '/rbac-test/salary-structures', {}, {
      Authorization: `Bearer ${payrollUsrToken}`
    });
    assert(resPayrollUsrSalStruct.status === 403, 'HR Payroll User cannot manage salary structures -> 403');

    // -------------------------------------------------------------
    // SCENARIO 4: HR PAYROLL MANAGER ROLE
    // -------------------------------------------------------------
    console.log('\n--- Scenario 4: HR Payroll Manager Role ---');

    // 4a. Create payrun -> ALLOW
    const resPayrollMgrPayrun = await request('POST', '/rbac-test/payruns', {}, {
      Authorization: `Bearer ${payrollMgrToken}`
    });
    assert(resPayrollMgrPayrun.status === 200, 'HR Payroll Manager can create payruns');

    // 4b. Manage salary structures -> ALLOW
    const resPayrollMgrSalStruct = await request('POST', '/rbac-test/salary-structures', {}, {
      Authorization: `Bearer ${payrollMgrToken}`
    });
    assert(resPayrollMgrSalStruct.status === 200, 'HR Payroll Manager can manage salary structures');

    // 4c. Attempt Admin-only system config -> FORBIDDEN (403)
    const resPayrollMgrAdmin = await request('GET', '/rbac-test/admin/system-config', null, {
      Authorization: `Bearer ${payrollMgrToken}`
    });
    assert(resPayrollMgrAdmin.status === 403, 'HR Payroll Manager cannot access admin-only system config -> 403');

    // -------------------------------------------------------------
    // SCENARIO 5: ADMIN ROLE
    // -------------------------------------------------------------
    console.log('\n--- Scenario 5: Admin Role ---');

    // 5a. Admin access employees -> ALLOW
    const resAdminEmp = await request('GET', '/rbac-test/employees/901', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(resAdminEmp.status === 200, 'Admin can access any employee record');

    // 5b. Admin create payrun -> ALLOW
    const resAdminPayrun = await request('POST', '/rbac-test/payruns', {}, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(resAdminPayrun.status === 200, 'Admin can create payruns');

    // 5c. Admin manage salary structures -> ALLOW
    const resAdminSalStruct = await request('POST', '/rbac-test/salary-structures', {}, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(resAdminSalStruct.status === 200, 'Admin can manage salary structures');

    // 5d. Admin access system config -> ALLOW
    const resAdminConfig = await request('GET', '/rbac-test/admin/system-config', null, {
      Authorization: `Bearer ${adminToken}`
    });
    assert(resAdminConfig.status === 200, 'Admin can access system config');

    // -------------------------------------------------------------
    // SCENARIO 6: GET /auth/me returns permissions & role_code
    // -------------------------------------------------------------
    console.log('\n--- Scenario 6: GET /auth/me Verification ---');
    const resMe = await request('GET', '/auth/me', null, {
      Authorization: `Bearer ${payrollMgrToken}`
    });
    assert(resMe.status === 200, 'GET /auth/me returns 200 OK');
    assert(resMe.body?.data?.user?.role_code === 'HR_PAYROLL_MANAGER', 'User profile includes role_code');
    assert(Array.isArray(resMe.body?.data?.user?.permissions), 'User profile includes permissions array');
    assert(resMe.body?.data?.user?.permissions.includes('salary_structure.manage'), 'Permissions include salary_structure.manage');

    console.log(`\n======================================================`);
    console.log(`📊 RBAC TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('RBAC test run failed with error:', err);
    failed++;
  } finally {
    // Cleanup
    await db('users').whereIn('email', [
      'test.emp@odoo.local',
      'test.hr_mgr@odoo.local',
      'test.payroll_usr@odoo.local',
      'test.payroll_mgr@odoo.local',
      'test.admin@odoo.local'
    ]).del();
    await db('employees').whereIn('id', [901, 902]).del();
    await db.destroy();
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

server = app.listen(PORT, async () => {
  console.log(`🛡️ RBAC Test Server running on port ${PORT}`);
  await runRbacTests();
});
