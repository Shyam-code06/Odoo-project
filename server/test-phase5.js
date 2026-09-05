process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
import { seedRbac } from './src/config/seedRbac.js';
import { hashPassword } from './src/utils/password.js';
import contractService from './src/services/contractService.js';
import scheduleService, { calculateDayHours, calculateTotalWeeklyHours } from './src/services/scheduleService.js';

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

async function runPhase5Tests() {
  console.log('🧪 ================= STARTING PHASE 5 TESTS: SCHEDULES & CONTRACTS ================= 🧪\n');
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
    await seedRbac();

    // 1. Setup test admin user
    const adminPassword = 'Password123!';
    const passwordHash = await hashPassword(adminPassword);

    await db('users').where('email', 'phase5.admin@odoo.local').del();
    const adminRole = await db('roles').where('code', 'ADMIN').first();

    const [adminUserId] = await db('users').insert({
      email: 'phase5.admin@odoo.local',
      password_hash: passwordHash,
      role_id: adminRole.id,
      is_active: true
    });

    const loginRes = await request('POST', '/auth/login', {
      email: 'phase5.admin@odoo.local',
      password: adminPassword
    });
    const adminToken = loginRes.body?.data?.tokens?.accessToken;
    const authHeaders = { Authorization: `Bearer ${adminToken}` };

    // Setup employee token for testing RBAC restrictions
    const empRole = await db('roles').where('code', 'EMPLOYEE').first();
    await db('users').where('email', 'phase5.emp@odoo.local').del();
    await db('users').insert({
      email: 'phase5.emp@odoo.local',
      password_hash: passwordHash,
      role_id: empRole.id,
      is_active: true
    });
    const empLogin = await request('POST', '/auth/login', {
      email: 'phase5.emp@odoo.local',
      password: adminPassword
    });
    const empToken = empLogin.body?.data?.tokens?.accessToken;
    const empHeaders = { Authorization: `Bearer ${empToken}` };

    // -------------------------------------------------------------------------
    // UNIT TESTS: Weekly Hours Calculation
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Unit Tests: Working Hours Calculation ---');
    const day1Hours = calculateDayHours('09:00:00', '17:00:00', 60);
    assert(day1Hours === 7.00, '09:00 to 17:00 minus 60m break calculates to exactly 7.00 hours');

    const day2Hours = calculateDayHours('08:30', '17:00', 30);
    assert(day2Hours === 8.00, '08:30 to 17:00 minus 30m break calculates to exactly 8.00 hours');

    const totalWeekly = calculateTotalWeeklyHours([
      { start_time: '09:00', end_time: '17:00', break_minutes: 60 },
      { start_time: '09:00', end_time: '17:00', break_minutes: 60 },
      { start_time: '09:00', end_time: '17:00', break_minutes: 60 },
      { start_time: '09:00', end_time: '17:00', break_minutes: 60 },
      { start_time: '09:00', end_time: '17:00', break_minutes: 60 }
    ]);
    assert(totalWeekly === 35.00, '5-day 7h shift sums up to 35.00 weekly hours');

    // -------------------------------------------------------------------------
    // API TESTS: Working Schedules
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Working Schedules API ---');

    // 2a. GET /api/schedules
    const resListSched = await request('GET', '/api/schedules', null, authHeaders);
    assert(resListSched.status === 200, 'GET /api/schedules returns 200 OK');
    assert(Array.isArray(resListSched.body?.data), 'Returns array of schedules');
    assert(resListSched.body?.data[0]?.total_weekly_hours !== undefined, 'Schedules include computed total_weekly_hours');

    // 2b. POST /api/schedules (Create new schedule with 5 days)
    const newSchedulePayload = {
      name: 'Test 40-Hour Shift',
      description: 'Monday to Friday 09:00 to 18:00 with 1 hour break',
      timezone: 'UTC',
      is_active: true,
      days: [
        { day_of_week: 'Monday', start_time: '09:00:00', end_time: '18:00:00', break_minutes: 60 },
        { day_of_week: 'Tuesday', start_time: '09:00:00', end_time: '18:00:00', break_minutes: 60 },
        { day_of_week: 'Wednesday', start_time: '09:00:00', end_time: '18:00:00', break_minutes: 60 },
        { day_of_week: 'Thursday', start_time: '09:00:00', end_time: '18:00:00', break_minutes: 60 },
        { day_of_week: 'Friday', start_time: '09:00:00', end_time: '18:00:00', break_minutes: 60 }
      ]
    };

    const resCreateSched = await request('POST', '/api/schedules', newSchedulePayload, authHeaders);
    assert(resCreateSched.status === 201, 'POST /api/schedules creates schedule (201 Created)');
    assert(resCreateSched.body?.data?.name === 'Test 40-Hour Shift', 'Schedule name matches');
    assert(resCreateSched.body?.data?.total_weekly_hours === 40.00, 'Total weekly hours automatically calculated as 40.00');
    assert(resCreateSched.body?.data?.days?.length === 5, '5 schedule days created');

    const createdScheduleId = resCreateSched.body?.data?.id;

    // 2c. GET /api/schedules/:id
    const resGetSched = await request('GET', `/api/schedules/${createdScheduleId}`, null, authHeaders);
    assert(resGetSched.status === 200, 'GET /api/schedules/:id returns 200 OK');
    assert(resGetSched.body?.data?.id === createdScheduleId, 'Returned schedule ID matches');
    assert(resGetSched.body?.data?.days?.length === 5, 'Days array attached in single view');

    // 2d. PUT /api/schedules/:id
    const resUpdateSched = await request(
      'PUT',
      `/api/schedules/${createdScheduleId}`,
      { description: 'Updated schedule description' },
      authHeaders
    );
    assert(resUpdateSched.status === 200, 'PUT /api/schedules/:id returns 200 OK');
    assert(resUpdateSched.body?.data?.description === 'Updated schedule description', 'Description updated');

    // 2e. Schedule Days: POST /api/schedules/:id/days
    const resAddDay = await request(
      'POST',
      `/api/schedules/${createdScheduleId}/days`,
      { day_of_week: 'Saturday', start_time: '10:00:00', end_time: '14:00:00', break_minutes: 0 },
      authHeaders
    );
    assert(resAddDay.status === 201, 'POST /api/schedules/:id/days adds Saturday (201 Created)');
    assert(resAddDay.body?.data?.total_weekly_hours === 44.00, 'Weekly hours recalculated to 44.00');

    // 2f. Duplicate Day Validation: Adding Saturday again should fail
    const resDupDay = await request(
      'POST',
      `/api/schedules/${createdScheduleId}/days`,
      { day_of_week: 'Saturday', start_time: '10:00:00', end_time: '14:00:00', break_minutes: 0 },
      authHeaders
    );
    assert(resDupDay.status === 409, 'Duplicate day addition rejected with 409 Conflict');

    // 2g. PUT /api/schedules/:id/days/:dayId
    const saturday = resAddDay.body?.data?.days?.find((d) => d.day_of_week === 'Saturday');
    const resUpdateDay = await request(
      'PUT',
      `/api/schedules/${createdScheduleId}/days/${saturday.id}`,
      { start_time: '10:00:00', end_time: '15:00:00', break_minutes: 60 },
      authHeaders
    );
    assert(resUpdateDay.status === 200, 'PUT /api/schedules/:id/days/:dayId updates Saturday');
    assert(resUpdateDay.body?.data?.total_weekly_hours === 44.00, 'Total hours reflect 4h Saturday');

    // 2h. DELETE /api/schedules/:id/days/:dayId
    const resDelDay = await request(
      'DELETE',
      `/api/schedules/${createdScheduleId}/days/${saturday.id}`,
      null,
      authHeaders
    );
    assert(resDelDay.status === 200, 'DELETE /api/schedules/:id/days/:dayId deletes Saturday');
    assert(resDelDay.body?.data?.total_weekly_hours === 40.00, 'Total hours restored to 40.00');

    // 2i. RBAC: Employee role cannot create or update schedules
    const resEmpSched = await request('POST', '/api/schedules', newSchedulePayload, empHeaders);
    assert(resEmpSched.status === 403, 'Employee role blocked from creating schedules (403 Forbidden)');

    // -------------------------------------------------------------------------
    // API TESTS: Contracts
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Contracts API & Overlap Validation ---');

    // Ensure test employee 1 exists
    const testEmployee = await db('employees').where('id', 1).first();

    // 3a. GET /api/contracts
    const resListContracts = await request('GET', '/api/contracts', null, authHeaders);
    assert(resListContracts.status === 200, 'GET /api/contracts returns 200 OK');
    assert(Array.isArray(resListContracts.body?.data), 'Returns array of contracts');

    // 3b. POST /api/contracts with invalid dates (start_date > end_date)
    const resInvalidDates = await request(
      'POST',
      '/api/contracts',
      {
        employee_id: testEmployee.id,
        start_date: '2026-12-31',
        end_date: '2026-01-01',
        wage: 50000
      },
      authHeaders
    );
    assert(resInvalidDates.status === 400, 'Contract with end_date < start_date rejected with 400 Bad Request');

    // 3c. Overlap prevention: testEmployee already has active contract (CNT-2020-001 from 2020-01-01 onwards)
    const resOverlap = await request(
      'POST',
      '/api/contracts',
      {
        employee_id: testEmployee.id,
        contract_number: 'CNT-OVERLAP-001',
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        wage: 95000,
        status: 'active'
      },
      authHeaders
    );
    assert(resOverlap.status === 409, 'Overlapping active contract creation rejected with 409 Conflict');
    assert(resOverlap.body?.code === 'ACTIVE_CONTRACT_OVERLAP', 'Returns ACTIVE_CONTRACT_OVERLAP code');

    // 3d. Create draft contract (draft allowed even if overlapping with active)
    const resCreateDraft = await request(
      'POST',
      '/api/contracts',
      {
        employee_id: testEmployee.id,
        contract_number: 'CNT-DRAFT-2027',
        start_date: '2027-01-01',
        end_date: '2027-12-31',
        wage: 130000,
        employment_type: 'full_time',
        status: 'draft'
      },
      authHeaders
    );
    assert(resCreateDraft.status === 201, 'POST /api/contracts creates draft contract (201 Created)');
    assert(resCreateDraft.body?.data?.status === 'draft', 'Contract status is draft');
    const draftContractId = resCreateDraft.body?.data?.id;

    // 3e. GET /api/contracts/:id
    const resGetContract = await request('GET', `/api/contracts/${draftContractId}`, null, authHeaders);
    assert(resGetContract.status === 200, 'GET /api/contracts/:id returns 200 OK');
    assert(resGetContract.body?.data?.contract_number === 'CNT-DRAFT-2027', 'Contract number matches');

    // 3f. PUT /api/contracts/:id
    const resUpdateContract = await request(
      'PUT',
      `/api/contracts/${draftContractId}`,
      { wage: 135000 },
      authHeaders
    );
    assert(resUpdateContract.status === 200, 'PUT /api/contracts/:id returns 200 OK');
    assert(Number(resUpdateContract.body?.data?.wage) === 135000, 'Contract wage updated to 135000');

    // 3g. PATCH /api/contracts/:id/status
    const resPatchStatus = await request(
      'PATCH',
      `/api/contracts/${draftContractId}/status`,
      { status: 'cancelled' },
      authHeaders
    );
    assert(resPatchStatus.status === 200, 'PATCH /api/contracts/:id/status returns 200 OK');
    assert(resPatchStatus.body?.data?.status === 'cancelled', 'Status patched to cancelled');

    // -------------------------------------------------------------------------
    // CRITICAL SERVICE: getApplicableContract
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Critical Payroll Service: getApplicableContract ---');

    // 4a. Resolve active contract for employee 1 in period 2026-03-01 to 2026-03-31
    const contract = await contractService.getApplicableContract(1, '2026-03-01', '2026-03-31');
    assert(Boolean(contract), 'getApplicableContract resolves active contract for employee 1');
    assert(contract.contract_number === 'CNT-2020-001', 'Resolved contract is CNT-2020-001');
    assert(contract.employee_code === 'EMP001', 'Contains joined employee details');

    // 4b. GET /api/contracts/applicable API endpoint
    const resApplicableApi = await request(
      'GET',
      '/api/contracts/applicable?employee_id=1&period_start=2026-03-01&period_end=2026-03-31',
      null,
      authHeaders
    );
    assert(resApplicableApi.status === 200, 'GET /api/contracts/applicable returns 200 OK');
    assert(resApplicableApi.body?.data?.contract_number === 'CNT-2020-001', 'API returned contract matches');

    // 4c. Non-existent contract period / employee without active contract -> 404
    let noContractError = null;
    try {
      await contractService.getApplicableContract(9999, '2026-01-01', '2026-01-31');
    } catch (err) {
      noContractError = err;
    }
    assert(Boolean(noContractError), 'getApplicableContract throws error when 0 contracts found');
    assert(noContractError?.code === 'NO_APPLICABLE_CONTRACT', 'Throws NO_APPLICABLE_CONTRACT error code');
    assert(noContractError?.statusCode === 404, 'Status code is 404');

    // 4d. Deletion prevention check: Schedule 1 is referenced by Employee 1 -> should fail deletion
    const resDelSchedBlocked = await request('DELETE', '/api/schedules/1', null, authHeaders);
    assert(resDelSchedBlocked.status === 409, 'Deleting referenced schedule blocked with 409 Conflict');

    // 4e. Delete unreferenced created schedule -> should succeed
    const resDelSched = await request('DELETE', `/api/schedules/${createdScheduleId}`, null, authHeaders);
    assert(resDelSched.status === 200, 'Deleting unreferenced schedule succeeds (200 OK)');

    console.log(`\n======================================================`);
    console.log(`📊 PHASE 5 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Phase 5 test run failed with error:', err);
    failed++;
  } finally {
    // Cleanup
    await db('contracts').where('contract_number', 'LIKE', 'CNT-%-2027').orWhere('contract_number', 'CNT-DRAFT-2027').del();
    await db('users').whereIn('email', ['phase5.admin@odoo.local', 'phase5.emp@odoo.local']).del();
    await db.destroy();
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

server = app.listen(PORT, async () => {
  console.log(`🧪 Phase 5 Test Server running on port ${PORT}`);
  await runPhase5Tests();
});
