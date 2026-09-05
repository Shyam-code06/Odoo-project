process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
import { hashPassword } from './src/utils/password.js';

let server;
const PORT = 5097;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
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

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 STARTING PHASE 4: EMPLOYEE MANAGEMENT TESTS 🧪');
  console.log('======================================================\n');

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

  let adminToken = '';
  let employeeToken = '';
  let createdEmployeeId = null;

  try {
    // 0. Setup test users for Admin and Employee
    const testAdminEmail = 'test.phase4.admin@odoo.local';
    const testEmpEmail = 'test.phase4.emp@odoo.local';
    const testPassword = 'Password123!';
    const passwordHash = await hashPassword(testPassword);

    await db('users').whereIn('email', [testAdminEmail, testEmpEmail]).del();

    // Create Admin user (role_id 1)
    await db('users').insert({
      email: testAdminEmail,
      password_hash: passwordHash,
      role_id: 1,
      is_active: true
    });

    // Create Employee user (role_id 4)
    await db('users').insert({
      email: testEmpEmail,
      password_hash: passwordHash,
      role_id: 4,
      is_active: true
    });

    // Clean up any old test employees if exists
    await db('employees').whereIn('employee_code', ['EMP888', 'EMP889']).del();

    // --- 1. AUTHENTICATION ---
    console.log('--- 1. Authentication ---');
    const adminLogin = await request('POST', '/api/auth/login', {
      email: testAdminEmail,
      password: testPassword
    });
    assert(adminLogin.status === 200, 'Admin login succeeds (200)');
    adminToken = adminLogin.body?.data?.tokens?.accessToken;
    assert(Boolean(adminToken), 'Admin access token received');

    const empLogin = await request('POST', '/api/auth/login', {
      email: testEmpEmail,
      password: testPassword
    });
    assert(empLogin.status === 200, 'Employee login succeeds (200)');
    employeeToken = empLogin.body?.data?.tokens?.accessToken;
    assert(Boolean(employeeToken), 'Employee access token received');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const empHeaders = { Authorization: `Bearer ${employeeToken}` };

    // --- 2. VALIDATION TESTS ---
    console.log('\n--- 2. Employee Validation Tests ---');

    // 2.1 Empty payload
    const valEmptyRes = await request('POST', '/api/employees', {}, adminHeaders);
    assert(valEmptyRes.status === 400, 'POST /api/employees with empty body returns 400');
    assert(valEmptyRes.body?.errors?.length >= 5, 'Returns errors for all required fields');

    // 2.2 Invalid email format
    const valEmailRes = await request('POST', '/api/employees', {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'not-an-email',
      joining_date: '2026-09-01'
    }, adminHeaders);
    assert(valEmailRes.status === 400, 'POST /api/employees with invalid email format returns 400');

    // 2.3 Invalid joining_date format
    const valDateRes = await request('POST', '/api/employees', {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'shyam@example.com',
      joining_date: '01-09-2026'
    }, adminHeaders);
    assert(valDateRes.status === 400, 'POST /api/employees with invalid date format returns 400');

    // 2.4 Invalid department_id
    const valDeptRes = await request('POST', '/api/employees', {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'shyam@example.com',
      joining_date: '2026-09-01',
      department_id: 99999
    }, adminHeaders);
    assert(valDeptRes.status === 400, 'POST /api/employees with invalid department_id returns 400');
    assert(valDeptRes.body?.message?.includes('department'), 'Error mentions referenced department');

    // 2.5 Invalid job_position_id
    const valPosRes = await request('POST', '/api/employees', {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'shyam@example.com',
      joining_date: '2026-09-01',
      job_position_id: 99999
    }, adminHeaders);
    assert(valPosRes.status === 400, 'POST /api/employees with invalid job_position_id returns 400');

    // 2.6 Invalid working_schedule_id
    const valSchedRes = await request('POST', '/api/employees', {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'shyam@example.com',
      joining_date: '2026-09-01',
      working_schedule_id: 99999
    }, adminHeaders);
    assert(valSchedRes.status === 400, 'POST /api/employees with invalid working_schedule_id returns 400');

    // 2.7 Invalid manager_id
    const valMgrRes = await request('POST', '/api/employees', {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'shyam@example.com',
      joining_date: '2026-09-01',
      manager_id: 99999
    }, adminHeaders);
    assert(valMgrRes.status === 400, 'POST /api/employees with invalid manager_id returns 400');

    // --- 3. CREATE EMPLOYEE ---
    console.log('\n--- 3. Employee Creation Tests ---');

    const validEmployeePayload = {
      employee_code: 'EMP888',
      first_name: 'Shyam',
      last_name: 'Patel',
      email: 'shyam.phase4@example.com',
      phone: '9876543210',
      date_of_birth: '2002-05-15',
      address: 'Ahmedabad, Gujarat',
      department_id: 1,
      job_position_id: 1,
      manager_id: 1,
      joining_date: '2026-09-01',
      employment_status: 'active',
      working_schedule_id: 1
    };

    // 3.1 Successful creation
    const createRes = await request('POST', '/api/employees', validEmployeePayload, adminHeaders);
    assert(createRes.status === 201, 'POST /api/employees returns 201 Created');
    assert(createRes.body?.success === true, 'Response success is true');
    assert(createRes.body?.data?.employee_code === 'EMP888', 'Employee code matches');
    assert(createRes.body?.data?.department_name === 'Engineering', 'Joined department_name is returned');
    assert(createRes.body?.data?.working_schedule_name === 'Standard 40 Hours', 'Joined working_schedule_name is returned');
    assert(Boolean(createRes.body?.data?.manager_name), 'Joined manager_name is returned');
    assert(!createRes.body?.data?.password_hash, 'Password fields are never exposed');
    createdEmployeeId = createRes.body?.data?.id;

    // 3.2 Duplicate employee_code conflict
    const dupCodeRes = await request('POST', '/api/employees', {
      ...validEmployeePayload,
      email: 'different.email@example.com'
    }, adminHeaders);
    assert(dupCodeRes.status === 409, 'Duplicate employee_code returns 409 Conflict');
    assert(dupCodeRes.body?.message === 'Employee code already exists', 'Error message matches duplicate code');

    // 3.3 Duplicate email conflict
    const dupEmailRes = await request('POST', '/api/employees', {
      ...validEmployeePayload,
      employee_code: 'EMP889'
    }, adminHeaders);
    assert(dupEmailRes.status === 409, 'Duplicate email returns 409 Conflict');
    assert(dupEmailRes.body?.message === 'Employee email already exists', 'Error message matches duplicate email');

    // --- 4. UPDATE & SELF-MANAGER RESTRICTION ---
    console.log('\n--- 4. Employee Update & Self-Manager Tests ---');

    // 4.1 Prevent employee from being their own manager
    const selfMgrRes = await request('PUT', `/api/employees/${createdEmployeeId}`, {
      manager_id: createdEmployeeId
    }, adminHeaders);
    assert(selfMgrRes.status === 400, 'Self-manager relationship returns 400 Bad Request');
    assert(
      selfMgrRes.body?.message?.includes('own manager') ||
      selfMgrRes.body?.errors?.some((e) => e.message?.includes('own manager')),
      'Error explains employee cannot be their own manager'
    );

    // 4.2 Valid update
    const updateRes = await request('PUT', `/api/employees/${createdEmployeeId}`, {
      first_name: 'Shyam Kumar',
      phone: '9998887770'
    }, adminHeaders);
    assert(updateRes.status === 200, 'PUT /api/employees/:id returns 200 OK');
    assert(updateRes.body?.data?.first_name === 'Shyam Kumar', 'Updated first_name matches');
    assert(updateRes.body?.data?.phone === '9998887770', 'Updated phone matches');
    assert(updateRes.body?.data?.created_at === createRes.body?.data?.created_at, 'created_at preserved');

    // --- 5. EMPLOYEE STATUS (PATCH) ---
    console.log('\n--- 5. Employee Status Tests ---');

    // 5.1 Invalid status
    const invStatusRes = await request('PATCH', `/api/employees/${createdEmployeeId}/status`, {
      employment_status: 'vacation'
    }, adminHeaders);
    assert(invStatusRes.status === 400, 'PATCH /api/employees/:id/status with invalid status returns 400');

    // 5.2 Valid status deactivation
    const patchStatusRes = await request('PATCH', `/api/employees/${createdEmployeeId}/status`, {
      employment_status: 'inactive'
    }, adminHeaders);
    assert(patchStatusRes.status === 200, 'PATCH /api/employees/:id/status returns 200 OK');
    assert(patchStatusRes.body?.data?.employment_status === 'inactive', 'employment_status updated to inactive');

    // --- 6. GET EMPLOYEES (LIST, SEARCH, FILTER, PAGINATION) ---
    console.log('\n--- 6. Get Employees (List, Search, Filters, Pagination) Tests ---');

    // 6.1 List all employees
    const listRes = await request('GET', '/api/employees', null, adminHeaders);
    assert(listRes.status === 200, 'GET /api/employees returns 200 OK');
    assert(listRes.body?.data?.length >= 4, 'Returns list of employees including seeded and created');
    assert(Boolean(listRes.body?.pagination), 'Pagination object is included in response');
    assert(listRes.body?.pagination?.page === 1, 'Pagination page is 1');

    // 6.2 Search by name/code
    const searchRes = await request('GET', '/api/employees?search=Shyam', null, adminHeaders);
    assert(searchRes.status === 200, 'GET /api/employees?search=Shyam returns 200 OK');
    assert(searchRes.body?.data?.length === 1, 'Search finds 1 matching employee');
    assert(searchRes.body?.data[0]?.employee_code === 'EMP888', 'Found employee code is EMP888');

    // 6.3 Filter by department_id
    const filterDeptRes = await request('GET', '/api/employees?department_id=1', null, adminHeaders);
    assert(filterDeptRes.status === 200, 'GET /api/employees?department_id=1 returns 200 OK');
    assert(filterDeptRes.body?.data?.every((e) => e.department_id === 1), 'All returned employees have department_id = 1');

    // 6.4 Filter by employment_status
    const filterStatusRes = await request('GET', '/api/employees?employment_status=inactive', null, adminHeaders);
    assert(filterStatusRes.status === 200, 'GET /api/employees?employment_status=inactive returns 200');
    assert(filterStatusRes.body?.data?.some((e) => e.id === createdEmployeeId), 'Inactive list includes updated test employee');

    // --- 7. GET SINGLE EMPLOYEE WITH SUMMARY COUNTS ---
    console.log('\n--- 7. Get Single Employee & Summary Counts Tests ---');

    // 7.1 Single employee with summary counts (EMP001 has contracts & leave allocations)
    const singleRes = await request('GET', '/api/employees/1', null, empHeaders);
    assert(singleRes.status === 200, 'GET /api/employees/1 returns 200 OK');
    assert(singleRes.body?.data?.employee_code === 'EMP001', 'Employee code matches EMP001');
    assert(Boolean(singleRes.body?.data?.summary), 'Summary counts object is returned');
    assert(typeof singleRes.body?.data?.summary?.contracts_count === 'number', 'contracts_count is a number');
    assert(singleRes.body?.data?.summary?.contracts_count >= 1, 'contracts_count reflects seeded contracts');
    assert(typeof singleRes.body?.data?.summary?.attendance_count === 'number', 'attendance_count is a number');
    assert(typeof singleRes.body?.data?.summary?.time_off_requests_count === 'number', 'time_off_requests_count is a number');
    assert(typeof singleRes.body?.data?.summary?.payslips_count === 'number', 'payslips_count is a number');

    // 7.2 Non-existent employee ID
    const notFoundRes = await request('GET', '/api/employees/99999', null, adminHeaders);
    assert(notFoundRes.status === 404, 'GET /api/employees/99999 returns 404 Not Found');

    // --- 8. DELETE PROTECTION ---
    console.log('\n--- 8. Delete Protection Tests ---');

    // 8.1 Delete employee with historical records (EMP001 has contracts) ➔ 409 Conflict
    const delBlockedRes = await request('DELETE', '/api/employees/1', null, adminHeaders);
    assert(delBlockedRes.status === 409, 'DELETE employee with historical records returns 409 Conflict');
    assert(
      delBlockedRes.body?.message?.includes('historical records') ||
      delBlockedRes.body?.message?.includes('deactivate'),
      'Clear conflict message advising deactivation'
    );

    // 8.2 Delete newly created employee with NO historical records ➔ 200 OK
    const delAllowedRes = await request('DELETE', `/api/employees/${createdEmployeeId}`, null, adminHeaders);
    assert(delAllowedRes.status === 200, 'DELETE unreferenced employee returns 200 OK');

    // 8.3 Verify employee is no longer in database
    const verifyDelRes = await request('GET', `/api/employees/${createdEmployeeId}`, null, adminHeaders);
    assert(verifyDelRes.status === 404, 'Verified employee is gone (returns 404)');

    // --- 9. RBAC AUTHORIZATION TESTS ---
    console.log('\n--- 9. Role-Based Access Control (RBAC) Tests ---');

    // 9.1 Employee role attempting to create employee (Forbidden)
    const empCreateForbidden = await request('POST', '/api/employees', validEmployeePayload, empHeaders);
    assert(empCreateForbidden.status === 403, 'Employee attempting POST /api/employees returns 403 Forbidden');

    // 9.2 Employee role attempting to update employee (Forbidden)
    const empUpdateForbidden = await request('PUT', '/api/employees/1', { first_name: 'Hacked' }, empHeaders);
    assert(empUpdateForbidden.status === 403, 'Employee attempting PUT /api/employees/1 returns 403 Forbidden');

    // 9.3 Employee role attempting to delete employee (Forbidden)
    const empDeleteForbidden = await request('DELETE', '/api/employees/1', null, empHeaders);
    assert(empDeleteForbidden.status === 403, 'Employee attempting DELETE /api/employees/1 returns 403 Forbidden');

    // 9.4 Unauthenticated request
    const unauthRes = await request('GET', '/api/employees');
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/employees returns 401 Unauthorized');

    console.log('\n======================================================');
    console.log(`📊 EMPLOYEE TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    // Cleanup test users and test employees
    await db('users').whereIn('email', ['test.phase4.admin@odoo.local', 'test.phase4.emp@odoo.local']).del();
    if (createdEmployeeId) {
      await db('employees').where({ id: createdEmployeeId }).del();
    }
    await db.destroy();
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

server = app.listen(PORT, async () => {
  console.log(`🧪 Employee Test Server running on port ${PORT}`);
  await runTests();
});
