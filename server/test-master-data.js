process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
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
  console.log('🧪 STARTING PHASE 3: MASTER DATA MANAGEMENT TESTS 🧪');
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
  let createdDeptId = null;
  let createdPosId = null;
  let createdTypeId = null;
  let createdCatId = null;

  try {
    // 0. Setup test users for Admin and Employee
    const testAdminEmail = 'test.phase3.admin@odoo.local';
    const testEmpEmail = 'test.phase3.emp@odoo.local';
    const passwordHash = await hashPassword('Password123!');

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

    // Login as Admin
    console.log('--- 1. Authentication ---');
    const adminLogin = await request('POST', '/api/auth/login', {
      email: testAdminEmail,
      password: 'Password123!'
    });
    assert(adminLogin.status === 200, 'Admin login succeeds (200)');
    adminToken = adminLogin.body?.data?.tokens?.accessToken;
    assert(Boolean(adminToken), 'Admin token received');

    // Login as Employee
    const empLogin = await request('POST', '/api/auth/login', {
      email: testEmpEmail,
      password: 'Password123!'
    });
    assert(empLogin.status === 200, 'Employee login succeeds (200)');
    employeeToken = empLogin.body?.data?.tokens?.accessToken;
    assert(Boolean(employeeToken), 'Employee token received');

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const empHeaders = { Authorization: `Bearer ${employeeToken}` };

    // --- 2. DEPARTMENTS ---
    console.log('\n--- 2. Departments Tests ---');

    // 2.1 Validation failure: missing name & code
    const deptValRes = await request('POST', '/api/departments', {}, adminHeaders);
    assert(deptValRes.status === 400, 'POST /api/departments with empty payload returns 400');
    assert(deptValRes.body?.errors?.length >= 2, 'Returns validation error list for missing fields');

    // 2.2 Invalid manager ID
    const deptInvMgrRes = await request('POST', '/api/departments', {
      name: 'R&D Department',
      code: 'RND',
      manager_id: 99999
    }, adminHeaders);
    assert(deptInvMgrRes.status === 400, 'POST /api/departments with invalid manager_id returns 400');

    // 2.3 Successful department creation
    const deptCreateRes = await request('POST', '/api/departments', {
      name: 'Research and Development',
      code: 'RND',
      description: 'Advanced Innovation Labs'
    }, adminHeaders);
    assert(deptCreateRes.status === 201, 'POST /api/departments returns 201 Created');
    assert(deptCreateRes.body?.success === true, 'Response success is true');
    assert(deptCreateRes.body?.data?.code === 'RND', 'Created department code matches');
    createdDeptId = deptCreateRes.body?.data?.id;

    // 2.4 Duplicate code rejection
    const deptDupRes = await request('POST', '/api/departments', {
      name: 'Another R&D',
      code: 'RND'
    }, adminHeaders);
    assert(deptDupRes.status === 409, 'Duplicate department code returns 409 Conflict');
    assert(deptDupRes.body?.message === 'Department code already exists', 'Error message indicates duplicate code');

    // 2.5 Get all departments (with search & pagination)
    const deptListRes = await request('GET', '/api/departments?search=research&page=1&limit=10', null, adminHeaders);
    assert(deptListRes.status === 200, 'GET /api/departments returns 200 OK');
    assert(deptListRes.body?.data?.length >= 1, 'Search by name returns matching department');
    assert(Boolean(deptListRes.body?.pagination), 'Pagination object is included');

    // 2.6 Get department by ID
    const deptGetRes = await request('GET', `/api/departments/${createdDeptId}`, null, empHeaders);
    assert(deptGetRes.status === 200, 'GET /api/departments/:id accessible by Employee role');
    assert(deptGetRes.body?.data?.id === createdDeptId, 'Department ID matches');

    // 2.7 Update department
    const deptUpdateRes = await request('PUT', `/api/departments/${createdDeptId}`, {
      name: 'Research & Advanced Tech'
    }, adminHeaders);
    assert(deptUpdateRes.status === 200, 'PUT /api/departments/:id returns 200 OK');
    assert(deptUpdateRes.body?.data?.name === 'Research & Advanced Tech', 'Department name updated');

    // --- 3. JOB POSITIONS ---
    console.log('\n--- 3. Job Positions Tests ---');

    // 3.1 Invalid department_id
    const posInvDeptRes = await request('POST', '/api/job-positions', {
      title: 'AI Researcher',
      code: 'AI_RES',
      department_id: 99999
    }, adminHeaders);
    assert(posInvDeptRes.status === 400, 'POST /api/job-positions with invalid department_id returns 400');

    // 3.2 Create valid job position
    const posCreateRes = await request('POST', '/api/job-positions', {
      title: 'AI Researcher',
      code: 'AI_RES',
      department_id: createdDeptId,
      description: 'Designs LLM and neural architectures'
    }, adminHeaders);
    assert(posCreateRes.status === 201, 'POST /api/job-positions returns 201 Created');
    assert(posCreateRes.body?.data?.code === 'AI_RES', 'Job position code matches');
    createdPosId = posCreateRes.body?.data?.id;

    // 3.3 Duplicate job position code
    const posDupRes = await request('POST', '/api/job-positions', {
      title: 'Duplicate AI',
      code: 'AI_RES',
      department_id: createdDeptId
    }, adminHeaders);
    assert(posDupRes.status === 409, 'Duplicate job position code returns 409 Conflict');

    // 3.4 Get job positions with department filter
    const posListRes = await request('GET', `/api/job-positions?department_id=${createdDeptId}`, null, adminHeaders);
    assert(posListRes.status === 200, 'GET /api/job-positions?department_id=... returns 200');
    assert(posListRes.body?.data?.length === 1, 'Returns 1 position for department');
    assert(posListRes.body?.data[0]?.department_name === 'Research & Advanced Tech', 'Department name joined in response');

    // 3.5 Update job position
    const posUpdateRes = await request('PUT', `/api/job-positions/${createdPosId}`, {
      title: 'Lead AI Researcher'
    }, adminHeaders);
    assert(posUpdateRes.status === 200, 'PUT /api/job-positions/:id returns 200 OK');
    assert(posUpdateRes.body?.data?.title === 'Lead AI Researcher', 'Position title updated');

    // 3.6 Delete Protection: Try deleting department referenced by job position
    console.log('\n--- 4. Delete Protection Checks ---');
    const deleteDeptBlockedRes = await request('DELETE', `/api/departments/${createdDeptId}`, null, adminHeaders);
    assert(deleteDeptBlockedRes.status === 409, 'DELETE department referenced by job position returns 409 Conflict');
    assert(
      deleteDeptBlockedRes.body?.message?.includes('cannot be deleted because it is being used'),
      'Clear conflict error message returned'
    );

    // --- 5. TIME OFF TYPES ---
    console.log('\n--- 5. Time Off Types Tests ---');

    // 5.1 Invalid unit
    const typeInvUnitRes = await request('POST', '/api/time-off/types', {
      name: 'Remote Work',
      code: 'REMOTE',
      unit: 'months'
    }, adminHeaders);
    assert(typeInvUnitRes.status === 400, 'POST /api/time-off/types with invalid unit returns 400');

    // 5.2 Create time off type
    const typeCreateRes = await request('POST', '/api/time-off/types', {
      name: 'Paternity Leave',
      code: 'PAT',
      unit: 'days',
      requires_allocation: true,
      requires_approval: true,
      is_paid: true,
      is_active: true
    }, adminHeaders);
    assert(typeCreateRes.status === 201, 'POST /api/time-off/types returns 201 Created');
    createdTypeId = typeCreateRes.body?.data?.id;

    // 5.3 Duplicate code
    const typeDupRes = await request('POST', '/api/time-off/types', {
      name: 'Paternity 2',
      code: 'PAT',
      unit: 'days'
    }, adminHeaders);
    assert(typeDupRes.status === 409, 'Duplicate time off type code returns 409 Conflict');

    // 5.4 Update status via PATCH /status
    const statusPatchRes = await request('PATCH', `/api/time-off/types/${createdTypeId}/status`, {
      is_active: false
    }, adminHeaders);
    assert(statusPatchRes.status === 200, 'PATCH /api/time-off/types/:id/status returns 200 OK');
    assert(statusPatchRes.body?.data?.is_active === 0 || statusPatchRes.body?.data?.is_active === false, 'is_active set to false');

    // 5.5 Delete protection for time off type referenced by allocation (type ID 1)
    const deleteReferencedTypeRes = await request('DELETE', '/api/time-off/types/1', null, adminHeaders);
    assert(deleteReferencedTypeRes.status === 409, 'DELETE time off type referenced by allocations returns 409 Conflict');

    // --- 6. SALARY RULE CATEGORIES ---
    console.log('\n--- 6. Salary Rule Categories Tests ---');

    // 6.1 Create category
    const catCreateRes = await request('POST', '/api/salary-rule-categories', {
      name: 'Performance Bonus',
      code: 'PERF_BONUS',
      parent_id: 2 // Allowance
    }, adminHeaders);
    assert(catCreateRes.status === 201, 'POST /api/salary-rule-categories returns 201 Created');
    createdCatId = catCreateRes.body?.data?.id;

    // 6.2 Duplicate category code
    const catDupRes = await request('POST', '/api/salary-rule-categories', {
      name: 'Bonus Duplicate',
      code: 'PERF_BONUS'
    }, adminHeaders);
    assert(catDupRes.status === 409, 'Duplicate salary rule category code returns 409 Conflict');

    // 6.3 Update category
    const catUpdateRes = await request('PUT', `/api/salary-rule-categories/${createdCatId}`, {
      name: 'Quarterly Performance Bonus'
    }, adminHeaders);
    assert(catUpdateRes.status === 200, 'PUT /api/salary-rule-categories/:id returns 200 OK');
    assert(catUpdateRes.body?.data?.name === 'Quarterly Performance Bonus', 'Category name updated');

    // 6.4 Delete protection for category used by salary rules (ID 1 = Basic)
    const deleteReferencedCatRes = await request('DELETE', '/api/salary-rule-categories/1', null, adminHeaders);
    assert(deleteReferencedCatRes.status === 409, 'DELETE category used by salary rules returns 409 Conflict');

    // --- 7. CLEANUP & UNREFERENCED DELETION ---
    console.log('\n--- 7. Unreferenced Deletion Tests ---');

    // 7.1 Delete unreferenced job position
    const deletePosRes = await request('DELETE', `/api/job-positions/${createdPosId}`, null, adminHeaders);
    assert(deletePosRes.status === 200, 'DELETE unreferenced job position returns 200 OK');

    // 7.2 Delete now-unreferenced department
    const deleteDeptRes = await request('DELETE', `/api/departments/${createdDeptId}`, null, adminHeaders);
    assert(deleteDeptRes.status === 200, 'DELETE unreferenced department returns 200 OK');

    // 7.3 Delete unreferenced time off type
    const deleteTypeRes = await request('DELETE', `/api/time-off/types/${createdTypeId}`, null, adminHeaders);
    assert(deleteTypeRes.status === 200, 'DELETE unreferenced time off type returns 200 OK');

    // 7.4 Delete unreferenced salary rule category
    const deleteCatRes = await request('DELETE', `/api/salary-rule-categories/${createdCatId}`, null, adminHeaders);
    assert(deleteCatRes.status === 200, 'DELETE unreferenced salary rule category returns 200 OK');

    // --- 8. RBAC AUTHORIZATION ---
    console.log('\n--- 8. Role-Based Access Control (RBAC) Tests ---');

    // 8.1 Employee role attempting to create department (forbidden)
    const empForbiddenRes = await request('POST', '/api/departments', {
      name: 'Hack Dept',
      code: 'HACK'
    }, empHeaders);
    assert(empForbiddenRes.status === 403, 'Employee attempting POST /api/departments returns 403 Forbidden');

    // 8.2 Unauthenticated request to /api/departments
    const unauthRes = await request('POST', '/api/departments', {
      name: 'No Auth Dept',
      code: 'NOAUTH'
    });
    assert(unauthRes.status === 401, 'Unauthenticated POST /api/departments returns 401 Unauthorized');

    console.log('\n======================================================');
    console.log(`📊 MASTER DATA TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
  } catch (err) {
    console.error('Test run failed with error:', err);
    failed++;
  } finally {
    // Cleanup test users
    await db('users').whereIn('email', ['test.phase3.admin@odoo.local', 'test.phase3.emp@odoo.local']).del();
    await db.destroy();
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

server = app.listen(PORT, async () => {
  console.log(`🧪 Master Data Test Server running on port ${PORT}`);
  await runTests();
});
