import { db } from './src/models/index.js';
import payrunService from './src/services/payrunService.js';
import payslipService from './src/services/payslipService.js';
import payslipPdfService from './src/services/payslipPdfService.js';

async function runEndToEndVerification() {
  console.log('=== STARTING PAYRUN VALIDATION -> PAYSLIP E2E VERIFICATION ===');

  try {
    // 1. Create a dedicated fresh test payrun with unique period
    const struct = await db('salary_structures').first();
    const testPeriodStart = `2027-01-01`;
    const testPeriodEnd = `2027-01-31`;

    // Clean up any prior test payruns for this period
    const prior = await db('payruns').where({ period_start: testPeriodStart, period_end: testPeriodEnd }).select('id');
    for (const p of prior) {
      await db('payslip_lines').whereIn('payslip_id', db('payslips').where({ payrun_id: p.id }).select('id')).del();
      await db('payslips').where({ payrun_id: p.id }).del();
      await db('payrun_employees').where({ payrun_id: p.id }).del();
      await db('payruns').where({ id: p.id }).del();
    }

    const [newId] = await db('payruns').insert({
      name: 'E2E Validation Payrun ' + Date.now(),
      salary_structure_id: struct ? struct.id : 1,
      period_start: testPeriodStart,
      period_end: testPeriodEnd,
      status: 'draft'
    });
    const payrun = await db('payruns').where({ id: newId }).first();

    console.log(`[Test 1] Created fresh test Payrun ID: ${payrun.id} (${payrun.name})`);

    // Ensure there are payrun employees
    let pes = await db('payrun_employees').where({ payrun_id: payrun.id });
    if (pes.length === 0) {
      const emp = await db('employees').first();
      const contract = await db('contracts').where({ employee_id: emp.id }).first();
      await db('payrun_employees').insert({
        payrun_id: payrun.id,
        employee_id: emp.id,
        contract_id: contract ? contract.id : 1,
        status: 'pending'
      });
    }

    // 2. Compute Payrun
    console.log('[Test 2] Computing Payrun...');
    const computeResult = await payrunService.computePayrun(payrun.id);
    console.log(`   -> Compute result: ${computeResult.status}, employee count: ${computeResult.employees?.length}`);

    // 3. Validate Payrun (Creates payslips + payslip_lines in transaction)
    console.log('[Test 3] Validating Payrun (Transaction & Snapshot Persistence)...');
    const validateResult = await payrunService.validatePayrun(payrun.id);
    console.log(`   -> Validate result: status=${validateResult.status}, payslips created=${validateResult.payslips?.length}`);

    // 4. Verify authoritative database records
    const payslipsInDb = await db('payslips').where({ payrun_id: payrun.id });
    console.log(`[Test 4] Verifying 'payslips' table source of truth: Found ${payslipsInDb.length} payslip(s) in DB.`);
    if (payslipsInDb.length === 0) {
      throw new Error('No payslip records persisted in DB after validation!');
    }

    const firstSlip = payslipsInDb[0];
    const linesInDb = await db('payslip_lines').where({ payslip_id: firstSlip.id });
    console.log(`   -> Payslip ID: ${firstSlip.id}, Net: $${firstSlip.net_salary}, Gross: $${firstSlip.gross_salary}`);
    console.log(`   -> Payslip Lines: Found ${linesInDb.length} calculation breakdown line(s).`);

    // 5. Test Duplicate Validation Protection / Idempotence
    console.log('[Test 5] Testing Duplicate Validation Protection (Second Validate Call)...');
    const revalidateResult = await payrunService.validatePayrun(payrun.id);
    const payslipsAfterRevalidate = await db('payslips').where({ payrun_id: payrun.id });
    console.log(`   -> Payslip count after re-validation: ${payslipsAfterRevalidate.length} (Expected: ${payslipsInDb.length})`);
    if (payslipsAfterRevalidate.length !== payslipsInDb.length) {
      throw new Error('Duplicate payslip records created upon second validation!');
    }
    console.log('   -> Duplicate protection check PASSED.');

    // 6. Test RBAC & IDOR Protection on Payslip Retrieval
    console.log('[Test 6] Testing RBAC & IDOR Security for Employee vs Admin...');
    
    // Admin user mock
    const adminUser = { id: 1, role_name: 'Admin', employee_id: 1 };
    const adminSlip = await payslipService.getPayslipById(firstSlip.id, adminUser);
    console.log(`   -> Admin successfully accessed payslip ${adminSlip.id} for employee ${adminSlip.employee_first_name} ${adminSlip.employee_last_name}`);

    // Authorized employee mock
    const authEmployeeUser = { id: 99, role_name: 'Employee', employee_id: firstSlip.employee_id };
    const empSlip = await payslipService.getPayslipById(firstSlip.id, authEmployeeUser);
    console.log(`   -> Authorized Employee (ID ${firstSlip.employee_id}) accessed their own payslip ${empSlip.id}`);

    // Unauthorized employee mock (IDOR check)
    const unauthorizedUser = { id: 88, role_name: 'Employee', employee_id: 999999 };
    try {
      await payslipService.getPayslipById(firstSlip.id, unauthorizedUser);
      throw new Error('IDOR check FAILED: Unauthorized employee was able to access another employee payslip!');
    } catch (err) {
      if (err.statusCode === 403 || err.code === 'FORBIDDEN') {
        console.log(`   -> IDOR check PASSED: Unauthorized employee blocked with 403 Forbidden.`);
      } else {
        throw err;
      }
    }

    // 7. Test Admin Directory Filtering, Search, and Pagination
    console.log('[Test 7] Testing Admin Payslip Directory Search & Pagination...');
    const directoryRes = await payslipService.getPayslips({ page: 1, limit: 10, status: 'generated' }, adminUser);
    console.log(`   -> Directory Query: Page ${directoryRes.pagination.page}/${directoryRes.pagination.totalPages}, Total Records: ${directoryRes.pagination.total}`);

    // 8. Test Payslip PDF Generation from Persisted Payslip
    console.log('[Test 8] Testing PDFKit Document Generation from Persisted Payslip...');
    const pdfBuffer = await payslipPdfService.generatePdfBuffer(adminSlip);
    console.log(`   -> PDF Buffer created: ${pdfBuffer.length} bytes, Header: ${pdfBuffer.slice(0, 5).toString()}`);
    if (!pdfBuffer.slice(0, 5).toString().startsWith('%PDF-')) {
      throw new Error('Invalid PDF output generated from payslip!');
    }
    console.log('   -> PDF Generation check PASSED.');

    console.log('\n=== ALL PAYRUN VALIDATION & PAYSLIP E2E TESTS PASSED SUCCESSFULLY! ===\n');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

runEndToEndVerification();
