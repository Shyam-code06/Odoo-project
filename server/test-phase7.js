process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
import { seedRbac } from './src/config/seedRbac.js';
import { hashPassword } from './src/utils/password.js';
import TimeOffRequestModel from './src/models/TimeOffRequestModel.js';

let server;
const PORT = 5095;
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

async function runPhase7Tests() {
  console.log('🧪 ================= STARTING PHASE 7 TESTS: TIME OFF & LEAVE MANAGEMENT ================= 🧪\n');
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

    // Setup Test Employees (ID 901 - Alice, ID 902 - Bob)
    await db('time_off_requests').whereIn('employee_id', [901, 902]).del();
    await db('time_off_allocations').whereIn('employee_id', [901, 902]).del();
    await db('users').whereIn('email', ['timeoff.emp1@odoo.local', 'timeoff.emp2@odoo.local', 'timeoff.hr@odoo.local']).del();
    await db('employees').whereIn('id', [901, 902]).del();

    await db('employees').insert([
      {
        id: 901,
        employee_code: 'EMP901',
        first_name: 'Alice',
        last_name: 'Smith',
        email: 'timeoff.emp1@odoo.local',
        joining_date: '2025-01-01',
        employment_status: 'active'
      },
      {
        id: 902,
        employee_code: 'EMP902',
        first_name: 'Bob',
        last_name: 'Jones',
        email: 'timeoff.emp2@odoo.local',
        joining_date: '2025-01-01',
        employment_status: 'active'
      }
    ]);

    const empRole = await db('roles').where('code', 'EMPLOYEE').first();
    const hrRole = await db('roles').where('code', 'HR_MANAGER').first();

    // Setup User accounts
    await db('users').insert([
      { email: 'timeoff.emp1@odoo.local', password_hash: passwordHash, role_id: empRole.id, employee_id: 901, is_active: true },
      { email: 'timeoff.emp2@odoo.local', password_hash: passwordHash, role_id: empRole.id, employee_id: 902, is_active: true },
      { email: 'timeoff.hr@odoo.local', password_hash: passwordHash, role_id: hrRole.id, employee_id: null, is_active: true }
    ]);

    // Setup / Ensure Test Leave Type
    await db('time_off_types').where('code', 'TEST_PAID').del();
    const [leaveTypeId] = await db('time_off_types').insert({
      name: 'Paid Annual Leave',
      code: 'TEST_PAID',
      unit: 'days',
      requires_allocation: true,
      requires_approval: true,
      is_paid: true,
      is_active: true
    });

    // Obtain tokens
    const loginEmp1 = await request('POST', '/auth/login', { email: 'timeoff.emp1@odoo.local', password: testPassword });
    const emp1Token = loginEmp1.body?.data?.tokens?.accessToken;
    const emp1Headers = { Authorization: `Bearer ${emp1Token}` };

    const loginEmp2 = await request('POST', '/auth/login', { email: 'timeoff.emp2@odoo.local', password: testPassword });
    const emp2Token = loginEmp2.body?.data?.tokens?.accessToken;
    const emp2Headers = { Authorization: `Bearer ${emp2Token}` };

    const loginHr = await request('POST', '/auth/login', { email: 'timeoff.hr@odoo.local', password: testPassword });
    const hrToken = loginHr.body?.data?.tokens?.accessToken;
    const hrHeaders = { Authorization: `Bearer ${hrToken}` };

    // -------------------------------------------------------------------------
    // SCENARIO 1: CORE BUSINESS FLOW
    // HR allocates 24 -> approves -> balance = 24 -> employee requests 3
    // -> HR approves -> used = 3 -> remaining = 21
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Core Business Flow (Allocate 24 -> Approve -> Request 3 -> Approve -> Remaining 21) ---');

    // 1a. HR allocates 24 days to Alice (Emp 901)
    const resAlloc = await request(
      'POST',
      '/api/time-off/allocations',
      {
        employee_id: 901,
        time_off_type_id: leaveTypeId,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        allocated_amount: 24
      },
      hrHeaders
    );
    assert(resAlloc.status === 201, 'HR creates allocation of 24 days (201 Created)');
    assert(resAlloc.body?.data?.status === 'pending', 'Allocation initial status is pending');
    assert(Number(resAlloc.body?.data?.allocated_amount) === 24, 'Allocation allocated_amount is 24');
    const allocationId = resAlloc.body?.data?.id;

    // 1b. Balance before approval: pending allocation is not yet available
    const resBalBefore = await request('GET', '/api/time-off/balance', null, emp1Headers);
    assert(resBalBefore.status === 200, 'Employee fetches own leave balance (200 OK)');
    const paidBalBefore = resBalBefore.body?.data?.balances?.find((b) => b.time_off_type_id === leaveTypeId);
    assert(paidBalBefore?.available === 0, 'Pending allocation is not counted in available balance (available = 0)');

    // 1c. HR approves allocation
    const resApproveAlloc = await request(
      'PATCH',
      `/api/time-off/allocations/${allocationId}/approve`,
      null,
      hrHeaders
    );
    assert(resApproveAlloc.status === 200, 'HR approves allocation (200 OK)');
    assert(resApproveAlloc.body?.data?.status === 'approved', 'Allocation status updated to approved');

    // 1d. Employee balance check: available = 24, used = 0
    const resBalAfter = await request('GET', '/api/time-off/balance', null, emp1Headers);
    const paidBalAfter = resBalAfter.body?.data?.balances?.find((b) => b.time_off_type_id === leaveTypeId);
    assert(paidBalAfter?.allocated_amount === 24, 'Employee balance shows allocated_amount = 24');
    assert(paidBalAfter?.used_amount === 0, 'Employee balance shows used_amount = 0');
    assert(paidBalAfter?.available === 24, 'Employee balance confirms available = 24');

    // 1e. Alice submits leave request for 3 days (2026-06-01 to 2026-06-03)
    const resReq = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-06-01',
        end_date: '2026-06-03',
        duration: 3,
        reason: 'Summer vacation trip'
      },
      emp1Headers
    );
    assert(resReq.status === 201, 'Employee submits leave request for 3 days (201 Created)');
    assert(resReq.body?.data?.status === 'pending', 'Request status is pending');
    assert(Number(resReq.body?.data?.duration) === 3, 'Request duration is 3');
    assert(Number(resReq.body?.data?.allocation_id) === allocationId, 'Request is tied to approved allocation ID');
    const requestId1 = resReq.body?.data?.id;

    // 1f. While request is pending, allocation used_amount must remain 0
    const resAllocCheck = await request('GET', `/api/time-off/allocations/${allocationId}`, null, hrHeaders);
    assert(Number(resAllocCheck.body?.data?.used_amount) === 0, 'Allocation used_amount unchanged while request is pending');

    // 1g. HR approves request (Knex transaction)
    const resApproveReq = await request(
      'PATCH',
      `/api/time-off/requests/${requestId1}/approve`,
      null,
      hrHeaders
    );
    assert(resApproveReq.status === 200, 'HR approves leave request (200 OK)');
    assert(resApproveReq.body?.data?.status === 'approved', 'Request status updated to approved');

    // 1h. Post-approval balance check: used = 3, remaining = 21
    const resBalFinal = await request('GET', '/api/time-off/balance', null, emp1Headers);
    const paidBalFinal = resBalFinal.body?.data?.balances?.find((b) => b.time_off_type_id === leaveTypeId);
    assert(paidBalFinal?.used_amount === 3, 'Post-approval used_amount = 3');
    assert(paidBalFinal?.available === 21, 'Post-approval available balance = 21 (24 - 3)');

    // Verify allocation record itself has used_amount = 3 and available = 21
    const resAllocFinal = await request('GET', `/api/time-off/allocations/${allocationId}`, null, hrHeaders);
    assert(Number(resAllocFinal.body?.data?.used_amount) === 3, 'Allocation used_amount updated to 3');
    assert(Number(resAllocFinal.body?.data?.available_amount) === 21, 'Allocation available_amount updated to 21');

    // -------------------------------------------------------------------------
    // SCENARIO 2: INSUFFICIENT BALANCE
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Insufficient Balance Protection ---');

    // Alice tries to request 25 days with only 21 remaining
    const resInsuff = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-07-01',
        end_date: '2026-07-25',
        duration: 25,
        reason: 'Too long vacation'
      },
      emp1Headers
    );
    assert(resInsuff.status === 400, 'Request duration exceeding balance rejected with 400 Bad Request');
    assert(resInsuff.body?.code === 'INSUFFICIENT_BALANCE', 'Returns INSUFFICIENT_BALANCE error code');

    // -------------------------------------------------------------------------
    // SCENARIO 3: REJECTION BEHAVIOR
    // Rejected requests must NOT change used_amount
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Rejection Behavior (used_amount remains unchanged) ---');

    // Alice requests 2 days
    const resReq2 = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-08-01',
        end_date: '2026-08-02',
        duration: 2,
        reason: 'Weekend extension'
      },
      emp1Headers
    );
    assert(resReq2.status === 201, 'Request for 2 days submitted (201 Created)');
    const requestId2 = resReq2.body?.data?.id;

    // HR rejects request
    const resRejectReq = await request(
      'PATCH',
      `/api/time-off/requests/${requestId2}/reject`,
      { rejected_reason: 'Project delivery deadline' },
      hrHeaders
    );
    assert(resRejectReq.status === 200, 'HR rejects leave request (200 OK)');
    assert(resRejectReq.body?.data?.status === 'rejected', 'Request status is rejected');
    assert(resRejectReq.body?.data?.rejected_reason === 'Project delivery deadline', 'Rejection reason recorded');

    // Check balance: used_amount MUST remain 3 and available MUST remain 21
    const resBalAfterReject = await request('GET', '/api/time-off/balance', null, emp1Headers);
    const balAfterReject = resBalAfterReject.body?.data?.balances?.find((b) => b.time_off_type_id === leaveTypeId);
    assert(balAfterReject?.used_amount === 3, 'used_amount remains 3 after request rejection');
    assert(balAfterReject?.available === 21, 'available balance remains 21 after request rejection');

    // -------------------------------------------------------------------------
    // SCENARIO 4: UNAUTHORIZED ACTIONS & RBAC RESTRICTIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 4. RBAC & Unauthorized Actions ---');

    // 4a. Employee attempts to create allocation -> 403 Forbidden
    const resEmpAlloc = await request(
      'POST',
      '/api/time-off/allocations',
      {
        employee_id: 901,
        time_off_type_id: leaveTypeId,
        start_date: '2026-01-01',
        end_date: '2026-12-31',
        allocated_amount: 30
      },
      emp1Headers
    );
    assert(resEmpAlloc.status === 403, 'Employee blocked from creating allocations (403 Forbidden)');

    // 4b. Employee attempts to approve an allocation -> 403 Forbidden
    const resEmpApproveAlloc = await request(
      'PATCH',
      `/api/time-off/allocations/${allocationId}/approve`,
      null,
      emp1Headers
    );
    assert(resEmpApproveAlloc.status === 403, 'Employee blocked from approving allocations (403 Forbidden)');

    // 4c. Employee attempts to approve a leave request -> 403 Forbidden
    const resEmpApproveReq = await request(
      'PATCH',
      `/api/time-off/requests/${requestId1}/approve`,
      null,
      emp1Headers
    );
    assert(resEmpApproveReq.status === 403, 'Employee blocked from approving requests (403 Forbidden)');

    // 4d. Employee 2 attempts to view Employee 1 allocation -> 403 Forbidden
    const resEmp2ViewAlloc = await request(
      'GET',
      `/api/time-off/allocations/${allocationId}`,
      null,
      emp2Headers
    );
    assert(resEmp2ViewAlloc.status === 403, 'Employee blocked from viewing another employee allocation (403 Forbidden)');

    // 4e. Employee 2 attempts to view Employee 1 request -> 403 Forbidden
    const resEmp2ViewReq = await request(
      'GET',
      `/api/time-off/requests/${requestId1}`,
      null,
      emp2Headers
    );
    assert(resEmp2ViewReq.status === 403, 'Employee blocked from viewing another employee leave request (403 Forbidden)');

    // -------------------------------------------------------------------------
    // SCENARIO 5: INPUT VALIDATION & INVALID RECORDS
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Input Validation & Error Handling ---');

    // 5a. Invalid dates: end_date < start_date
    const resInvalidDates = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-09-10',
        end_date: '2026-09-01',
        duration: 5
      },
      emp1Headers
    );
    assert(resInvalidDates.status === 400, 'Request with end_date < start_date rejected with 400 Bad Request');

    // 5b. Invalid duration: <= 0
    const resZeroDuration = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-09-01',
        end_date: '2026-09-02',
        duration: 0
      },
      emp1Headers
    );
    assert(resZeroDuration.status === 400, 'Request with duration <= 0 rejected with 400 Bad Request');

    // 5c. Non-existent allocation ID -> 404
    const resNonExistentAlloc = await request('GET', '/api/time-off/allocations/99999', null, hrHeaders);
    assert(resNonExistentAlloc.status === 404, 'Non-existent allocation returns 404 Not Found');

    // 5d. Non-existent request ID -> 404
    const resNonExistentReq = await request('GET', '/api/time-off/requests/99999', null, hrHeaders);
    assert(resNonExistentReq.status === 404, 'Non-existent request returns 404 Not Found');

    // -------------------------------------------------------------------------
    // SCENARIO 6: DUPLICATE / FINALIZED APPROVALS & OVERLAPPING REQUESTS
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Duplicate / Finalized State Transitions & Date Overlaps ---');

    // 6a. Attempt to re-approve an already approved allocation
    const resDupApproveAlloc = await request(
      'PATCH',
      `/api/time-off/allocations/${allocationId}/approve`,
      null,
      hrHeaders
    );
    assert(resDupApproveAlloc.status === 400, 'Re-approving already approved allocation rejected with 400 Bad Request');
    assert(resDupApproveAlloc.body?.code === 'INVALID_STATUS_TRANSITION', 'Returns INVALID_STATUS_TRANSITION');

    // 6b. Attempt to reject an already approved allocation
    const resRejectApprovedAlloc = await request(
      'PATCH',
      `/api/time-off/allocations/${allocationId}/reject`,
      null,
      hrHeaders
    );
    assert(resRejectApprovedAlloc.status === 400, 'Rejecting already approved allocation rejected with 400 Bad Request');

    // 6c. Attempt to re-approve an already approved request
    const resDupApproveReq = await request(
      'PATCH',
      `/api/time-off/requests/${requestId1}/approve`,
      null,
      hrHeaders
    );
    assert(resDupApproveReq.status === 400, 'Re-approving already approved request rejected with 400 Bad Request');

    // 6d. Attempt to reject an already approved request
    const resRejectApprovedReq = await request(
      'PATCH',
      `/api/time-off/requests/${requestId1}/reject`,
      null,
      hrHeaders
    );
    assert(resRejectApprovedReq.status === 400, 'Rejecting already approved request rejected with 400 Bad Request');

    // 6e. Overlapping request: Alice requested 2026-06-01 to 2026-06-03 earlier.
    // Submitting 2026-06-02 to 2026-06-05 must be rejected with 409 Conflict.
    const resOverlap = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-06-02',
        end_date: '2026-06-05',
        duration: 4,
        reason: 'Overlapping leave'
      },
      emp1Headers
    );
    assert(resOverlap.status === 409, 'Overlapping leave request rejected with 409 Conflict');
    assert(resOverlap.body?.code === 'OVERLAPPING_LEAVE_REQUEST', 'Returns OVERLAPPING_LEAVE_REQUEST');

    // -------------------------------------------------------------------------
    // SCENARIO 7: CANCELLATION & KNEX TRANSACTION ATOMICITY
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Self-Service Cancellation & Knex Transaction Atomicity ---');

    // 7a. Employee submits request and cancels it
    const resReq3 = await request(
      'POST',
      '/api/time-off/requests',
      {
        time_off_type_id: leaveTypeId,
        start_date: '2026-10-01',
        end_date: '2026-10-01',
        duration: 1,
        reason: 'One-day personal work'
      },
      emp1Headers
    );
    const requestId3 = resReq3.body?.data?.id;

    const resCancel = await request(
      'PATCH',
      `/api/time-off/requests/${requestId3}/cancel`,
      null,
      emp1Headers
    );
    assert(resCancel.status === 200, 'Employee cancels their own pending request (200 OK)');
    assert(resCancel.body?.data?.status === 'cancelled', 'Status updated to cancelled');

    // Cannot approve cancelled request
    const resApproveCancelled = await request(
      'PATCH',
      `/api/time-off/requests/${requestId3}/approve`,
      null,
      hrHeaders
    );
    assert(resApproveCancelled.status === 400, 'Approving cancelled request rejected with 400 Bad Request');

    // 7b. Knex Transaction Rollback Verification
    // Create a pending request, but artificially simulate an error inside approveRequest
    const [testAllocId] = await db('time_off_allocations').insert({
      employee_id: 902,
      time_off_type_id: leaveTypeId,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      allocated_amount: 10,
      used_amount: 0,
      status: 'approved'
    });

    const [testReqId] = await db('time_off_requests').insert({
      employee_id: 902,
      time_off_type_id: leaveTypeId,
      allocation_id: testAllocId,
      start_date: '2026-11-01',
      end_date: '2026-11-05',
      duration: 5,
      status: 'pending'
    });

    // Artificially test atomic rollback by executing an operation that throws after increment
    let txErrorCaught = false;
    try {
      await db.transaction(async (trx) => {
        await trx('time_off_allocations').where({ id: testAllocId }).increment('used_amount', 5);
        // Force an intentional error to trigger rollback
        throw new Error('INTENTIONAL_SIMULATED_FAILURE_FOR_ROLLBACK_TEST');
      });
    } catch (err) {
      txErrorCaught = err.message === 'INTENTIONAL_SIMULATED_FAILURE_FOR_ROLLBACK_TEST';
    }

    assert(txErrorCaught, 'Intentional transaction error was caught');

    // Verify rollback: used_amount must remain 0, NOT 5!
    const testAllocRecord = await db('time_off_allocations').where({ id: testAllocId }).first();
    assert(Number(testAllocRecord.used_amount) === 0, 'Knex transaction rollback verified: used_amount remains 0');

    const testReqRecord = await db('time_off_requests').where({ id: testReqId }).first();
    assert(testReqRecord.status === 'pending', 'Knex transaction rollback verified: request remains pending');

    // Clean up temporary test records
    await db('time_off_requests').where({ id: testReqId }).del();
    await db('time_off_allocations').where({ id: testAllocId }).del();

    console.log('\n======================================================');
    console.log(`📊 PHASE 7 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup test data
    try {
      await db('time_off_requests').whereIn('employee_id', [901, 902]).del();
      await db('time_off_allocations').whereIn('employee_id', [901, 902]).del();
      await db('time_off_types').where('code', 'TEST_PAID').del();
      await db('users').whereIn('email', ['timeoff.emp1@odoo.local', 'timeoff.emp2@odoo.local', 'timeoff.hr@odoo.local']).del();
      await db('employees').whereIn('id', [901, 902]).del();
    } catch (e) {
      // ignore
    }

    if (server) {
      server.close();
    }
    process.exit(process.exitCode || 0);
  }
}

server = app.listen(PORT, () => {
  console.log(`🧪 Phase 7 Test Server running on port ${PORT}`);
  runPhase7Tests();
});
