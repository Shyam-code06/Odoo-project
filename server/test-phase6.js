process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
import { seedRbac } from './src/config/seedRbac.js';
import { hashPassword } from './src/utils/password.js';
import { DEFAULT_OFFICE_LATITUDE, DEFAULT_OFFICE_LONGITUDE } from './src/utils/geolocation.js';

let server;
const PORT = 5096;
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

async function runPhase6Tests() {
  console.log('🧪 ================= STARTING PHASE 6 TESTS: ATTENDANCE & ON-SITE VERIFICATION ================= 🧪\n');
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

    const testPassword = 'Password123!';
    const passwordHash = await hashPassword(testPassword);

    // Setup Test Employees (ID 801, 802)
    await db('attendance').whereIn('employee_id', [801, 802]).del();
    await db('users').whereIn('email', ['att.emp1@odoo.local', 'att.emp2@odoo.local', 'att.hr@odoo.local']).del();
    await db('employees').whereIn('id', [801, 802]).del();

    await db('employees').insert([
      {
        id: 801,
        employee_code: 'EMP801',
        first_name: 'Alice',
        last_name: 'Walker',
        email: 'att.emp1@odoo.local',
        joining_date: '2025-01-01',
        working_schedule_id: 1, // Standard 40h (Mon-Fri 09:00 - 17:00)
        employment_status: 'active'
      },
      {
        id: 802,
        employee_code: 'EMP802',
        first_name: 'Bob',
        last_name: 'Miller',
        email: 'att.emp2@odoo.local',
        joining_date: '2025-01-01',
        working_schedule_id: 1,
        employment_status: 'active'
      }
    ]);

    const empRole = await db('roles').where('code', 'EMPLOYEE').first();
    const hrRole = await db('roles').where('code', 'HR_MANAGER').first();

    // Setup User accounts
    await db('users').insert([
      { email: 'att.emp1@odoo.local', password_hash: passwordHash, role_id: empRole.id, employee_id: 801, is_active: true },
      { email: 'att.emp2@odoo.local', password_hash: passwordHash, role_id: empRole.id, employee_id: 802, is_active: true },
      { email: 'att.hr@odoo.local', password_hash: passwordHash, role_id: hrRole.id, employee_id: null, is_active: true }
    ]);

    // Obtain tokens
    const loginEmp1 = await request('POST', '/auth/login', { email: 'att.emp1@odoo.local', password: testPassword });
    const emp1Token = loginEmp1.body?.data?.tokens?.accessToken;
    const emp1Headers = { Authorization: `Bearer ${emp1Token}` };

    const loginEmp2 = await request('POST', '/auth/login', { email: 'att.emp2@odoo.local', password: testPassword });
    const emp2Token = loginEmp2.body?.data?.tokens?.accessToken;
    const emp2Headers = { Authorization: `Bearer ${emp2Token}` };

    const loginHr = await request('POST', '/auth/login', { email: 'att.hr@odoo.local', password: testPassword });
    const hrToken = loginHr.body?.data?.tokens?.accessToken;
    const hrHeaders = { Authorization: `Bearer ${hrToken}` };

    // Valid on-site coordinates (at office location)
    const onSiteCoords = {
      latitude: DEFAULT_OFFICE_LATITUDE,
      longitude: DEFAULT_OFFICE_LONGITUDE
    };

    // Far off-site coordinates (e.g. 1500km away in Bengaluru)
    const offSiteCoords = {
      latitude: 12.971598,
      longitude: 77.594566
    };

    // -------------------------------------------------------------------------
    // SCENARIO 1: GPS GEOFENCE ON-SITE VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- 1. On-Site GPS Geolocation Verification ---');

    // 1a. Missing GPS coordinates on employee check-in -> REJECTED
    const resNoGeo = await request('POST', '/api/attendance/check-in', {}, emp1Headers);
    assert(resNoGeo.status === 400, 'Check-in without GPS coordinates rejected with 400 Bad Request');

    // 1b. Off-site GPS coordinates -> REJECTED (403 OUTSIDE_GEOFENCE)
    const resOffSite = await request(
      'POST',
      '/api/attendance/check-in',
      {
        ...offSiteCoords,
        attendance_date: '2026-04-01',
        check_in: '2026-04-01T09:00:00'
      },
      emp1Headers
    );
    assert(resOffSite.status === 403, 'Off-site check-in outside allowed radius rejected with 403 Forbidden');

    // 1c. On-site GPS coordinates -> ACCEPTED (201 Created)
    const resOnSite = await request(
      'POST',
      '/api/attendance/check-in',
      {
        ...onSiteCoords,
        attendance_date: '2026-04-01',
        check_in: '2026-04-01T09:00:00'
      },
      emp1Headers
    );
    assert(resOnSite.status === 201, 'On-site check-in within geofence radius succeeds (201 Created)');
    assert(resOnSite.body?.data?.geolocation_verification?.is_verified === true, 'Response confirms geolocation verification');
    assert(resOnSite.body?.data?.status === 'present', 'On-time 09:00 check-in marked as status: present');

    const attendanceId1 = resOnSite.body?.data?.id;

    // -------------------------------------------------------------------------
    // SCENARIO 2: CHECK-IN / CHECK-OUT LOGIC & WORKED MINUTES
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Check-In / Check-Out & Worked Minutes ---');

    // 2a. Duplicate Check-in on same day -> REJECTED
    const resDupCheckIn = await request(
      'POST',
      '/api/attendance/check-in',
      {
        ...onSiteCoords,
        attendance_date: '2026-04-01',
        check_in: '2026-04-01T09:30:00'
      },
      emp1Headers
    );
    assert(resDupCheckIn.status === 409, 'Duplicate check-in on same date rejected with 409 Conflict');

    // 2b. Check-out timestamp before check-in timestamp -> REJECTED
    const resInvalidCheckOut = await request(
      'POST',
      '/api/attendance/check-out',
      {
        ...onSiteCoords,
        attendance_date: '2026-04-01',
        check_out: '2026-04-01T08:30:00' // Before 09:00 check-in
      },
      emp1Headers
    );
    assert(resInvalidCheckOut.status === 400, 'Check-out before check-in rejected with 400 Bad Request');

    // 2c. Successful Check-out (09:00 to 17:30 = 8.5 hours = 510 minutes)
    const resCheckOut = await request(
      'POST',
      '/api/attendance/check-out',
      {
        ...onSiteCoords,
        attendance_date: '2026-04-01',
        check_out: '2026-04-01T17:30:00'
      },
      emp1Headers
    );
    assert(resCheckOut.status === 200, 'Check-out succeeds with 200 OK');
    assert(resCheckOut.body?.data?.worked_minutes === 510, 'Worked minutes accurately calculated as 510 minutes (8.5 hrs)');
    assert(resCheckOut.body?.data?.worked_hours === 8.5, 'Worked hours formatted as 8.50');

    // 2d. Duplicate Check-out after already checked out -> REJECTED
    const resDupCheckOut = await request(
      'POST',
      '/api/attendance/check-out',
      {
        ...onSiteCoords,
        attendance_date: '2026-04-01',
        check_out: '2026-04-01T18:00:00'
      },
      emp1Headers
    );
    assert(resDupCheckOut.status === 409, 'Duplicate check-out on completed day rejected with 409 Conflict');

    // -------------------------------------------------------------------------
    // SCENARIO 3: SCHEDULE & LATE STATUS INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Schedule Integration & Late Status ---');

    // 3a. Late Check-in (10:30 AM when schedule starts at 09:00) -> status: 'late'
    const resLateCheckIn = await request(
      'POST',
      '/api/attendance/check-in',
      {
        ...onSiteCoords,
        attendance_date: '2026-04-02',
        check_in: '2026-04-02T10:30:00'
      },
      emp1Headers
    );
    assert(resLateCheckIn.status === 201, 'Late check-in recorded');
    assert(resLateCheckIn.body?.data?.status === 'late', 'Check-in after 09:15 scheduled time marked as status: late');

    // -------------------------------------------------------------------------
    // SCENARIO 4: OWN-ATTENDANCE & RBAC BARRIERS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Own Attendance History & Access Restrictions ---');

    // 4a. Employee 1 views own attendance history
    const resMyAtt = await request('GET', '/api/attendance/my', null, emp1Headers);
    assert(resMyAtt.status === 200, 'GET /api/attendance/my returns 200 OK');
    assert(resMyAtt.body?.data?.length >= 2, 'Returns Alice (Emp 801) personal records');

    // 4b. Employee 1 views own record by ID
    const resGetOwn = await request('GET', `/api/attendance/${attendanceId1}`, null, emp1Headers);
    assert(resGetOwn.status === 200, 'Employee can view their own attendance record by ID');

    // 4c. Employee 2 attempts to view Employee 1's record -> 403 Forbidden
    const resGetOther = await request('GET', `/api/attendance/${attendanceId1}`, null, emp2Headers);
    assert(resGetOther.status === 403, 'Employee 2 blocked from viewing Employee 1 attendance record (403 Forbidden)');

    // 4d. Employee attempts to perform manual correction -> 403 Forbidden
    const resEmpCorrect = await request(
      'PUT',
      `/api/attendance/${attendanceId1}/correct`,
      {
        check_in: '2026-04-01T08:00:00',
        correction_reason: 'I want earlier time'
      },
      emp1Headers
    );
    assert(resEmpCorrect.status === 403, 'Employee blocked from making manual corrections (403 Forbidden)');

    // -------------------------------------------------------------------------
    // SCENARIO 5: HR MANUAL CORRECTION & AUDITABILITY
    // -------------------------------------------------------------------------
    console.log('\n--- 5. HR Manual Correction & Auditing ---');

    // 5a. Correction without correction_reason -> REJECTED (400)
    const resNoReason = await request(
      'PUT',
      `/api/attendance/${attendanceId1}/correct`,
      {
        check_in: '2026-04-01T08:45:00'
      },
      hrHeaders
    );
    assert(resNoReason.status === 400, 'Correction without correction_reason rejected with 400 Bad Request');

    // 5b. Valid HR correction (adjust check-in to 08:45:00, check-out 17:15:00 = 510 mins)
    const resHrCorrect = await request(
      'PUT',
      `/api/attendance/${attendanceId1}/correct`,
      {
        check_in: '2026-04-01T08:45:00',
        check_out: '2026-04-01T17:15:00',
        status: 'present',
        correction_reason: 'Biometric device synchronization adjustment'
      },
      hrHeaders
    );
    assert(resHrCorrect.status === 200, 'HR manual correction succeeds (200 OK)');
    assert(resHrCorrect.body?.data?.correction_reason === 'Biometric device synchronization adjustment', 'Correction reason stored');
    assert(Boolean(resHrCorrect.body?.data?.corrected_by), 'corrected_by user ID recorded for audit trail');
    assert(resHrCorrect.body?.data?.worked_minutes === 510, 'Worked minutes recalculated upon correction');

    // 5c. HR Manual Attendance Creation
    const resHrCreate = await request(
      'POST',
      '/api/attendance',
      {
        employee_id: 802,
        attendance_date: '2026-04-03',
        check_in: '2026-04-03T09:00:00',
        check_out: '2026-04-03T17:00:00',
        status: 'present',
        correction_reason: 'Manual attendance log for client site visit'
      },
      hrHeaders
    );
    assert(resHrCreate.status === 201, 'HR can manually create attendance record (201 Created)');
    assert(resHrCreate.body?.data?.employee_id === 802, 'Created for employee 802');

    // 5d. HR list all attendance records with filters
    const resHrList = await request('GET', '/api/attendance?date_from=2026-04-01&date_to=2026-04-03', null, hrHeaders);
    assert(resHrList.status === 200, 'HR can list and filter company attendance records');
    assert(resHrList.body?.data?.length >= 3, 'HR list includes all created records');

    console.log(`\n======================================================`);
    console.log(`📊 PHASE 6 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log(`======================================================\n`);
  } catch (err) {
    console.error('Phase 6 test run failed with error:', err);
    failed++;
  } finally {
    // Cleanup test data
    await db('attendance').whereIn('employee_id', [801, 802]).del();
    await db('users').whereIn('email', ['att.emp1@odoo.local', 'att.emp2@odoo.local', 'att.hr@odoo.local']).del();
    await db('employees').whereIn('id', [801, 802]).del();
    await db.destroy();
    server.close(() => {
      process.exit(failed > 0 ? 1 : 0);
    });
  }
}

server = app.listen(PORT, async () => {
  console.log(`🧪 Phase 6 Test Server running on port ${PORT}`);
  await runPhase6Tests();
});
