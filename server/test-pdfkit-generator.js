/**
 * Unit Test: Payslip PDFKit Generation Engine
 * Tests PDFKit document creation, dynamic line streaming, and magic byte validation
 */

import { Writable } from 'stream';
import payslipPdfService from './src/services/payslipPdfService.js';

class MockResponse extends Writable {
  constructor() {
    super();
    this.chunks = [];
    this.headers = {};
    this.headersSent = false;
  }

  setHeader(name, value) {
    this.headers[name] = value;
  }

  _write(chunk, encoding, callback) {
    this.chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
    callback();
  }

  getBuffer() {
    return Buffer.concat(this.chunks);
  }
}

const runUnitTest = async () => {
  console.log('🧪 Testing PDFKit Payslip Generation Unit Test...\n');

  const mockPayslip = {
    id: 101,
    employee_id: 42,
    employee_first_name: 'Devon',
    employee_last_name: 'Engineer',
    employee_code: 'EMP042',
    department_name: 'Engineering',
    job_title: 'Lead Software Architect',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    payrun_name: 'PAYRUN-2026-08',
    structure_name: 'Engineering Structure',
    employment_type: 'full_time',
    gross_salary: 125000.00,
    total_deductions: 12500.00,
    net_salary: 112500.00,
    status: 'paid',
    lines: [
      { id: 1, name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 1, rate: 100, quantity: 1, amount: 75000.00 },
      { id: 2, name: 'House Rent Allowance', code: 'HRA', category: 'ALW', sequence: 2, rate: 50, quantity: 1, amount: 37500.00 },
      { id: 3, name: 'Special Allowance', code: 'SA', category: 'ALW', sequence: 3, rate: 100, quantity: 1, amount: 12500.00 },
      { id: 4, name: 'Provident Fund (PF)', code: 'PF', category: 'DED', sequence: 4, rate: 12, quantity: 1, amount: 9000.00 },
      { id: 5, name: 'Professional Tax', code: 'PT', category: 'DED', sequence: 5, rate: 100, quantity: 1, amount: 3500.00 }
    ]
  };

  const mockRes = new MockResponse();

  await payslipPdfService.streamPayslipPdf(mockPayslip, mockRes);

  const pdfBuffer = mockRes.getBuffer();
  console.log(`Generated PDF Buffer size: ${pdfBuffer.length} bytes`);

  // Assertions
  const header = pdfBuffer.slice(0, 5).toString('ascii');
  if (header === '%PDF-') {
    console.log('✅ PASS: PDF binary header starts with %PDF-');
  } else {
    console.error(`❌ FAIL: Invalid PDF header: ${header}`);
    process.exit(1);
  }

  if (pdfBuffer.length > 2000) {
    console.log('✅ PASS: PDF content size indicates full document with tables and layout');
  } else {
    console.error('❌ FAIL: PDF buffer too small');
    process.exit(1);
  }

  console.log('\n🎉 PDFKit Unit Test Passed Successfully!\n');
};

runUnitTest();
