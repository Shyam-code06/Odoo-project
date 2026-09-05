process.env.NODE_ENV = 'test';

import http from 'http';
import app from './index.js';
import { db } from './src/config/db.js';
import { seedRbac } from './src/config/seedRbac.js';
import { hashPassword } from './src/utils/password.js';

let server;
const PORT = 5094;
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

async function runPhase8Tests() {
  console.log('🧪 ================= STARTING PHASE 8 TESTS: SALARY CONFIGURATION ================= 🧪\n');
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

    // Setup Test User accounts for various roles
    const adminRole = await db('roles').where('code', 'ADMIN').first();
    const hrPayrollMgrRole = await db('roles').where('code', 'HR_PAYROLL_MANAGER').first();
    const hrPayrollUserRole = await db('roles').where('code', 'HR_PAYROLL_USER').first();
    const hrManagerRole = await db('roles').where('code', 'HR_MANAGER').first();
    const employeeRole = await db('roles').where('code', 'EMPLOYEE').first();

    await db('users').whereIn('email', [
      'sal.admin@odoo.local',
      'sal.paymgr@odoo.local',
      'sal.payuser@odoo.local',
      'sal.hrmgr@odoo.local',
      'sal.emp@odoo.local'
    ]).del();

    await db('users').insert([
      { email: 'sal.admin@odoo.local', password_hash: passwordHash, role_id: adminRole.id, is_active: true },
      { email: 'sal.paymgr@odoo.local', password_hash: passwordHash, role_id: hrPayrollMgrRole.id, is_active: true },
      { email: 'sal.payuser@odoo.local', password_hash: passwordHash, role_id: hrPayrollUserRole.id, is_active: true },
      { email: 'sal.hrmgr@odoo.local', password_hash: passwordHash, role_id: hrManagerRole.id, is_active: true },
      { email: 'sal.emp@odoo.local', password_hash: passwordHash, role_id: employeeRole.id, is_active: true }
    ]);

    // Clean up test structures/rules
    await db('salary_rules').where('code', 'like', 'TEST_%').del();
    await db('salary_structures').where('code', 'like', 'TEST_%').del();

    // Ensure Categories exist
    let basicCat = await db('salary_rule_categories').where('code', 'BASIC').first();
    if (!basicCat) {
      const [id] = await db('salary_rule_categories').insert({ name: 'Basic', code: 'BASIC' });
      basicCat = { id, code: 'BASIC', name: 'Basic' };
    }
    let alwCat = await db('salary_rule_categories').where('code', 'ALW').first();
    if (!alwCat) {
      const [id] = await db('salary_rule_categories').insert({ name: 'Allowance', code: 'ALW' });
      alwCat = { id, code: 'ALW', name: 'Allowance' };
    }
    let dedCat = await db('salary_rule_categories').where('code', 'DED').first();
    if (!dedCat) {
      const [id] = await db('salary_rule_categories').insert({ name: 'Deduction', code: 'DED' });
      dedCat = { id, code: 'DED', name: 'Deduction' };
    }
    let netCat = await db('salary_rule_categories').where('code', 'NET').first();
    if (!netCat) {
      const [id] = await db('salary_rule_categories').insert({ name: 'Net', code: 'NET' });
      netCat = { id, code: 'NET', name: 'Net' };
    }

    // Login tokens
    const loginAdmin = await request('POST', '/auth/login', { email: 'sal.admin@odoo.local', password: testPassword });
    const adminHeaders = { Authorization: `Bearer ${loginAdmin.body?.data?.tokens?.accessToken}` };

    const loginPayUser = await request('POST', '/auth/login', { email: 'sal.payuser@odoo.local', password: testPassword });
    const payUserHeaders = { Authorization: `Bearer ${loginPayUser.body?.data?.tokens?.accessToken}` };

    const loginHrMgr = await request('POST', '/auth/login', { email: 'sal.hrmgr@odoo.local', password: testPassword });
    const hrMgrHeaders = { Authorization: `Bearer ${loginHrMgr.body?.data?.tokens?.accessToken}` };

    const loginEmp = await request('POST', '/auth/login', { email: 'sal.emp@odoo.local', password: testPassword });
    const empHeaders = { Authorization: `Bearer ${loginEmp.body?.data?.tokens?.accessToken}` };

    // -------------------------------------------------------------------------
    // SCENARIO 1: CORE FLOW (Create Structure -> Categories -> Rules -> Retrieve)
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Core Flow: Salary Structure & Rules Configuration ---');

    // 1a. Admin creates Salary Structure
    const resCreateStruct = await request(
      'POST',
      '/api/salary-structures',
      {
        name: 'Standard Regular Staff Salary',
        code: 'TEST_REG_2026',
        description: 'Standard salary structure for regular full-time staff',
        is_active: true
      },
      adminHeaders
    );
    assert(resCreateStruct.status === 201, 'Admin creates salary structure (201 Created)');
    assert(resCreateStruct.body?.data?.code === 'TEST_REG_2026', 'Structure code matches');
    assert(Array.isArray(resCreateStruct.body?.data?.rules), 'Rules array is present');
    const structureId = resCreateStruct.body?.data?.id;

    // 1b. Admin creates Salary Rules with out-of-order sequences
    // Rule 1: Basic Salary (Sequence 10, Percentage 50%)
    const resRule1 = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: basicCat.id,
        name: 'Basic Salary',
        code: 'TEST_BASIC',
        sequence: 10,
        calculation_type: 'percentage',
        value: 50.0
      },
      adminHeaders
    );
    assert(resRule1.status === 201, 'Admin creates Basic Salary rule (201 Created)');
    assert(Number(resRule1.body?.data?.value) === 50, 'Basic rule value is 50');

    // Rule 2: Net Salary (Sequence 100, Formula) - added before intermediate rules to test sorting!
    const resRuleNet = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: netCat.id,
        name: 'Net Salary',
        code: 'TEST_NET',
        sequence: 100,
        calculation_type: 'formula',
        formula_expression: 'BASIC + HRA + MEDICAL - PF'
      },
      adminHeaders
    );
    assert(resRuleNet.status === 201, 'Admin creates Net Salary formula rule (201 Created)');
    assert(resRuleNet.body?.data?.formula_expression === 'BASIC + HRA + MEDICAL - PF', 'Formula expression matches');

    // Rule 3: Direct attach via /api/salary-structures/:id/rules (Sequence 20, Percentage 30%)
    const resRuleHra = await request(
      'POST',
      `/api/salary-structures/${structureId}/rules`,
      {
        category_id: alwCat.id,
        name: 'House Rent Allowance',
        code: 'TEST_HRA',
        sequence: 20,
        calculation_type: 'percentage',
        value: 30.0
      },
      adminHeaders
    );
    assert(resRuleHra.status === 201, 'Direct attach HRA rule to structure (201 Created)');

    // Rule 4: Medical Allowance (Sequence 30, Fixed $2500)
    const resRuleMed = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: alwCat.id,
        name: 'Medical Allowance',
        code: 'TEST_MEDICAL',
        sequence: 30,
        calculation_type: 'fixed',
        value: 2500.0
      },
      adminHeaders
    );
    assert(resRuleMed.status === 201, 'Admin creates fixed Medical Allowance rule (201 Created)');

    // Rule 5: Provident Fund Deduction (Sequence 40, Percentage 12%)
    const resRulePf = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: dedCat.id,
        name: 'Provident Fund',
        code: 'TEST_PF',
        sequence: 40,
        calculation_type: 'percentage',
        value: 12.0
      },
      adminHeaders
    );
    assert(resRulePf.status === 201, 'Admin creates PF deduction rule (201 Created)');

    // 1c. Retrieve complete structure with rules
    const resGetStruct = await request('GET', `/api/salary-structures/${structureId}`, null, adminHeaders);
    assert(resGetStruct.status === 200, 'Retrieve complete salary structure (200 OK)');
    assert(resGetStruct.body?.data?.rules?.length === 5, 'Structure contains all 5 attached rules');

    // Verify rules are ordered strictly by sequence ASC
    const sequences = resGetStruct.body?.data?.rules?.map((r) => r.sequence);
    assert(
      JSON.stringify(sequences) === JSON.stringify([10, 20, 30, 40, 100]),
      'Rules are returned in exact sequence execution order (10 -> 20 -> 30 -> 40 -> 100)'
    );

    // Verify category info joined in rules
    const basicRule = resGetStruct.body?.data?.rules?.find((r) => r.code === 'TEST_BASIC');
    assert(basicRule?.category_name === 'Basic', 'Joined category_name is Basic');
    assert(basicRule?.category_code === 'BASIC', 'Joined category_code is BASIC');

    // -------------------------------------------------------------------------
    // SCENARIO 2: CALCULATION TYPES & FORMULA VALIDATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Calculation Types & Formula Validation ---');

    // 2a. Invalid calculation type
    const resInvalidType = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: basicCat.id,
        name: 'Invalid Calc',
        code: 'TEST_INV_1',
        calculation_type: 'invalid_type'
      },
      adminHeaders
    );
    assert(resInvalidType.status === 400, 'Invalid calculation_type rejected with 400 Bad Request');

    // 2b. Missing formula_expression when calculation_type is formula
    const resMissingFormula = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: netCat.id,
        name: 'Empty Formula',
        code: 'TEST_INV_2',
        calculation_type: 'formula',
        formula_expression: ''
      },
      adminHeaders
    );
    assert(resMissingFormula.status === 400, 'Empty formula_expression rejected with 400 Bad Request');

    // 2c. Negative value for fixed rule
    const resNegValue = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: alwCat.id,
        name: 'Negative Allowance',
        code: 'TEST_INV_3',
        calculation_type: 'fixed',
        value: -100
      },
      adminHeaders
    );
    assert(resNegValue.status === 400, 'Negative value rejected with 400 Bad Request');

    // -------------------------------------------------------------------------
    // SCENARIO 3: INVALID REFERENCES & DUPLICATE CONFIGURATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Invalid References & Duplicate Configurations ---');

    // 3a. Duplicate structure code
    const resDupStruct = await request(
      'POST',
      '/api/salary-structures',
      {
        name: 'Duplicate Structure',
        code: 'TEST_REG_2026'
      },
      adminHeaders
    );
    assert(resDupStruct.status === 409, 'Duplicate structure code rejected with 409 Conflict');
    assert(resDupStruct.body?.code === 'DUPLICATE_CODE', 'Returns DUPLICATE_CODE');

    // 3b. Duplicate rule code within the same structure
    const resDupRule = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: basicCat.id,
        name: 'Duplicate Basic',
        code: 'TEST_BASIC',
        calculation_type: 'fixed',
        value: 1000
      },
      adminHeaders
    );
    assert(resDupRule.status === 409, 'Duplicate rule code in same structure rejected with 409 Conflict');
    assert(resDupRule.body?.code === 'DUPLICATE_RULE_CODE', 'Returns DUPLICATE_RULE_CODE');

    // 3c. Invalid salary_structure_id reference
    const resBadStructRef = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: 99999,
        category_id: basicCat.id,
        name: 'Ghost Structure Rule',
        code: 'TEST_GHOST',
        calculation_type: 'fixed',
        value: 1000
      },
      adminHeaders
    );
    assert(resBadStructRef.status === 400, 'Non-existent structure ID rejected with 400 Bad Request');
    assert(resBadStructRef.body?.code === 'INVALID_STRUCTURE', 'Returns INVALID_STRUCTURE');

    // 3d. Invalid category_id reference
    const resBadCatRef = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: 99999,
        name: 'Ghost Category Rule',
        code: 'TEST_GHOST_CAT',
        calculation_type: 'fixed',
        value: 1000
      },
      adminHeaders
    );
    assert(resBadCatRef.status === 400, 'Non-existent category ID rejected with 400 Bad Request');
    assert(resBadCatRef.body?.code === 'INVALID_CATEGORY', 'Returns INVALID_CATEGORY');

    // -------------------------------------------------------------------------
    // SCENARIO 4: ROLE-BASED ACCESS CONTROL (RBAC)
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Role-Based Access Control (RBAC) ---');

    // 4a. Employee blocked from creating structures
    const resEmpCreateStruct = await request(
      'POST',
      '/api/salary-structures',
      { name: 'Emp Structure', code: 'TEST_EMP_STR' },
      empHeaders
    );
    assert(resEmpCreateStruct.status === 403, 'Employee blocked from creating structure (403 Forbidden)');

    // 4b. Employee blocked from creating rules
    const resEmpCreateRule = await request(
      'POST',
      '/api/salary-rules',
      {
        salary_structure_id: structureId,
        category_id: basicCat.id,
        name: 'Emp Rule',
        code: 'TEST_EMP_R',
        calculation_type: 'fixed',
        value: 100
      },
      empHeaders
    );
    assert(resEmpCreateRule.status === 403, 'Employee blocked from creating rule (403 Forbidden)');

    // 4c. HR Manager blocked from writing salary structures (HR Manager has no payroll access)
    const resHrMgrCreate = await request(
      'POST',
      '/api/salary-structures',
      { name: 'HR Manager Structure', code: 'TEST_HRMGR_STR' },
      hrMgrHeaders
    );
    assert(resHrMgrCreate.status === 403, 'HR Manager blocked from creating salary structure (403 Forbidden)');

    // 4d. HR Payroll User can READ structures and rules
    const resPayUserGetStruct = await request('GET', '/api/salary-structures', null, payUserHeaders);
    assert(resPayUserGetStruct.status === 200, 'HR Payroll User has read access to structures (200 OK)');

    const resPayUserGetRules = await request('GET', '/api/salary-rules', null, payUserHeaders);
    assert(resPayUserGetRules.status === 200, 'HR Payroll User has read access to rules (200 OK)');

    // 4e. HR Payroll User is BLOCKED from writing/creating
    const resPayUserWrite = await request(
      'POST',
      '/api/salary-structures',
      { name: 'Pay User Write', code: 'TEST_PAYU_STR' },
      payUserHeaders
    );
    assert(resPayUserWrite.status === 403, 'HR Payroll User blocked from creating structure (403 Forbidden)');

    // -------------------------------------------------------------------------
    // SCENARIO 5: ACTIVE / INACTIVE STATUS MANAGEMENT & FILTERING
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Active / Inactive Status Management ---');

    // 5a. Deactivate PF rule
    const pfRule = resGetStruct.body?.data?.rules?.find((r) => r.code === 'TEST_PF');
    const resDeactRule = await request(
      'PATCH',
      `/api/salary-rules/${pfRule.id}/status`,
      { is_active: false },
      adminHeaders
    );
    assert(resDeactRule.status === 200, 'Deactivate salary rule (200 OK)');
    assert(resDeactRule.body?.data?.is_active === false, 'Rule is_active is false');

    // 5b. Fetching structure with active_only=true excludes inactive PF rule
    const resActiveOnly = await request(
      'GET',
      `/api/salary-structures/${structureId}?active_only=true`,
      null,
      adminHeaders
    );
    assert(resActiveOnly.body?.data?.rules?.length === 4, 'active_only=true returns 4 active rules (PF excluded)');

    // Re-activate PF rule
    await request(
      'PATCH',
      `/api/salary-rules/${pfRule.id}/status`,
      { is_active: true },
      adminHeaders
    );

    // 5c. Deactivate structure
    const resDeactStruct = await request(
      'PATCH',
      `/api/salary-structures/${structureId}/status`,
      { is_active: false },
      adminHeaders
    );
    assert(resDeactStruct.status === 200, 'Deactivate salary structure (200 OK)');
    assert(resDeactStruct.body?.data?.is_active === false, 'Structure is_active is false');

    // Re-activate structure
    await request(
      'PATCH',
      `/api/salary-structures/${structureId}/status`,
      { is_active: true },
      adminHeaders
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: UPDATE, REFERENTIAL INTEGRITY & DELETION
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Updates & Referential Integrity Protection on Delete ---');

    // 6a. Update rule value
    const resUpdateRule = await request(
      'PUT',
      `/api/salary-rules/${pfRule.id}`,
      { value: 12.5 },
      adminHeaders
    );
    assert(resUpdateRule.status === 200, 'Update rule value (200 OK)');
    assert(Number(resUpdateRule.body?.data?.value) === 12.5, 'PF value updated to 12.5');

    // 6b. Update structure description
    const resUpdateStruct = await request(
      'PUT',
      `/api/salary-structures/${structureId}`,
      { description: 'Updated template description' },
      adminHeaders
    );
    assert(resUpdateStruct.status === 200, 'Update structure description (200 OK)');
    assert(resUpdateStruct.body?.data?.description === 'Updated template description', 'Description matches');

    // 6c. Referential integrity: Link structure to a contract, then attempt delete
    const [testEmpId] = await db('employees').insert({
      employee_code: 'TEST_EMP_S8',
      first_name: 'Test',
      last_name: 'Salary',
      email: 'sal.contract.test@odoo.local',
      joining_date: '2025-01-01',
      employment_status: 'active'
    });

    const [testContractId] = await db('contracts').insert({
      employee_id: testEmpId,
      contract_number: 'CNT-TEST-SAL-8',
      salary_structure_id: structureId,
      wage: 80000.0,
      start_date: '2026-01-01',
      status: 'active'
    });

    const resDelBlocked = await request('DELETE', `/api/salary-structures/${structureId}`, null, adminHeaders);
    assert(resDelBlocked.status === 409, 'Deleting structure referenced by contract blocked with 409 Conflict');
    assert(resDelBlocked.body?.code === 'RECORD_REFERENCED', 'Returns RECORD_REFERENCED error code');

    // Remove referencing contract & employee
    await db('contracts').where('id', testContractId).del();
    await db('employees').where('id', testEmpId).del();

    // 6d. Now delete unreferenced structure -> succeeds (cascading attached rules)
    const resDelSuccess = await request('DELETE', `/api/salary-structures/${structureId}`, null, adminHeaders);
    assert(resDelSuccess.status === 200, 'Deleting unreferenced structure succeeds (200 OK)');

    // Verify structure is gone (404)
    const resVerifyGone = await request('GET', `/api/salary-structures/${structureId}`, null, adminHeaders);
    assert(resVerifyGone.status === 404, 'Verified structure returns 404 Not Found');

    console.log('\n======================================================');
    console.log(`📊 PHASE 8 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Fatal test runner error:', err);
    process.exitCode = 1;
  } finally {
    // Cleanup
    try {
      await db('contracts').where('contract_number', 'CNT-TEST-SAL-8').del();
      await db('employees').where('email', 'sal.contract.test@odoo.local').del();
      await db('salary_rules').where('code', 'like', 'TEST_%').del();
      await db('salary_structures').where('code', 'like', 'TEST_%').del();
      await db('users').whereIn('email', [
        'sal.admin@odoo.local',
        'sal.paymgr@odoo.local',
        'sal.payuser@odoo.local',
        'sal.hrmgr@odoo.local',
        'sal.emp@odoo.local'
      ]).del();
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
  console.log(`🧪 Phase 8 Test Server running on port ${PORT}`);
  runPhase8Tests();
});
