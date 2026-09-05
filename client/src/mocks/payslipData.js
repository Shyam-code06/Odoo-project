/**
 * Payslips & Payslip Lines Mock Dataset
 */

export let MOCK_PAYSLIPS = [
  {
    id: 'slip-payrun-101-emp-001',
    payrun_id: 'payrun-101',
    employee_id: 'emp-001',
    contract_id: 'con-001',
    salary_structure_id: 'struct-001',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    gross_salary: 73000,
    total_deductions: 6200,
    net_salary: 66800,
    status: 'paid',
    email_sent_at: '2026-08-31T18:00:00Z',
    created_at: '2026-08-30T09:00:00Z',
    updated_at: '2026-08-31T17:00:00Z',
  },
  {
    id: 'slip-payrun-101-emp-002',
    payrun_id: 'payrun-101',
    employee_id: 'emp-002',
    contract_id: 'con-002',
    salary_structure_id: 'struct-001',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    gross_salary: 94000,
    total_deductions: 8000,
    net_salary: 86000,
    status: 'paid',
    email_sent_at: '2026-08-31T18:05:00Z',
    created_at: '2026-08-30T09:00:00Z',
    updated_at: '2026-08-31T17:00:00Z',
  },
  {
    id: 'slip-payrun-101-emp-003',
    payrun_id: 'payrun-101',
    employee_id: 'emp-003',
    contract_id: 'con-003',
    salary_structure_id: 'struct-001',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    gross_salary: 108000,
    total_deductions: 9200,
    net_salary: 98800,
    status: 'paid',
    email_sent_at: undefined,
    created_at: '2026-08-30T09:00:00Z',
    updated_at: '2026-08-31T17:00:00Z',
  },
  {
    id: 'slip-payrun-102-emp-004',
    payrun_id: 'payrun-102',
    employee_id: 'emp-004',
    contract_id: 'con-004',
    salary_structure_id: 'struct-002',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    gross_salary: 205000,
    total_deductions: 14400,
    net_salary: 190600,
    status: 'generated',
    email_sent_at: undefined,
    created_at: '2026-09-02T10:00:00Z',
    updated_at: '2026-09-02T10:00:00Z',
  },
];

export let MOCK_PAYSLIP_LINES = [
  // slip-payrun-101-emp-001 (Rahul Sharma)
  { id: 'line-001-1', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-001', name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 10, amount: 50000, quantity: 1, calculation_details: 'Contract wage ₹50,000 × 100%' },
  { id: 'line-001-2', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-002', name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'ALW', sequence: 20, amount: 20000, quantity: 1, calculation_details: 'Basic Salary (₹50,000) × 40%' },
  { id: 'line-001-3', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-003', name: 'Conveyance Allowance', code: 'CONV', category: 'ALW', sequence: 30, amount: 3000, quantity: 1, calculation_details: 'Fixed conveyance allowance' },
  { id: 'line-001-4', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-004', name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 40, amount: 73000, quantity: 1, calculation_details: 'BASIC + HRA + CONV' },
  { id: 'line-001-5', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-005', name: 'Provident Fund (PF)', code: 'PF', category: 'DED', sequence: 50, amount: 6000, quantity: 1, calculation_details: 'Basic Salary (₹50,000) × 12%' },
  { id: 'line-001-6', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-006', name: 'Professional Tax', code: 'PT', category: 'DED', sequence: 60, amount: 200, quantity: 1, calculation_details: 'Statutory professional tax slab' },
  { id: 'line-001-7', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-007', name: 'Total Deductions', code: 'DEDUCTIONS', category: 'DED', sequence: 70, amount: 6200, quantity: 1, calculation_details: 'PF + PT' },
  { id: 'line-001-8', payslip_id: 'slip-payrun-101-emp-001', salary_rule_id: 'rule-008', name: 'Net Salary', code: 'NET', category: 'NET', sequence: 80, amount: 66800, quantity: 1, calculation_details: 'GROSS - DEDUCTIONS' },

  // slip-payrun-101-emp-002 (Priya Mehta)
  { id: 'line-002-1', payslip_id: 'slip-payrun-101-emp-002', salary_rule_id: 'rule-001', name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 10, amount: 65000, quantity: 1, calculation_details: 'Contract wage ₹65,000 × 100%' },
  { id: 'line-002-2', payslip_id: 'slip-payrun-101-emp-002', salary_rule_id: 'rule-002', name: 'House Rent Allowance (HRA)', code: 'HRA', category: 'ALW', sequence: 20, amount: 26000, quantity: 1, calculation_details: 'Basic Salary (₹65,000) × 40%' },
  { id: 'line-002-3', payslip_id: 'slip-payrun-101-emp-002', salary_rule_id: 'rule-003', name: 'Conveyance Allowance', code: 'CONV', category: 'ALW', sequence: 30, amount: 3000, quantity: 1, calculation_details: 'Fixed conveyance allowance' },
  { id: 'line-002-4', payslip_id: 'slip-payrun-101-emp-002', salary_rule_id: 'rule-004', name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 40, amount: 94000, quantity: 1, calculation_details: 'BASIC + HRA + CONV' },
  { id: 'line-002-5', payslip_id: 'slip-payrun-101-emp-002', salary_rule_id: 'rule-005', name: 'Provident Fund (PF)', code: 'PF', category: 'DED', sequence: 50, amount: 7800, quantity: 1, calculation_details: 'Basic Salary (₹65,000) × 12%' },
  { id: 'line-002-6', payslip_id: 'slip-payrun-101-emp-002', salary_rule_id: 'rule-006', name: 'Professional Tax', code: 'PT', category: 'DED', sequence: 60, amount: 200, quantity: 1, calculation_details: 'Statutory professional tax slab' },

  // slip-payrun-102-emp-004 (Ananya Sharma - Executive)
  { id: 'line-004-1', payslip_id: 'slip-payrun-102-emp-004', salary_rule_id: 'rule-009', name: 'Executive Basic', code: 'BASIC', category: 'BASIC', sequence: 10, amount: 120000, quantity: 1, calculation_details: 'Contract wage ₹1,20,000 × 100%' },
  { id: 'line-004-2', payslip_id: 'slip-payrun-102-emp-004', salary_rule_id: 'rule-010', name: 'Executive HRA', code: 'HRA', category: 'ALW', sequence: 20, amount: 60000, quantity: 1, calculation_details: 'Executive Basic (₹1,20,000) × 50%' },
  { id: 'line-004-3', payslip_id: 'slip-payrun-102-emp-004', salary_rule_id: 'rule-011', name: 'Special Executive Allowance', code: 'SEA', category: 'ALW', sequence: 30, amount: 25000, quantity: 1, calculation_details: 'Fixed executive leadership allowance' },
  { id: 'line-004-4', payslip_id: 'slip-payrun-102-emp-004', salary_rule_id: 'rule-012', name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 40, amount: 205000, quantity: 1, calculation_details: 'BASIC + HRA + SEA' },
  { id: 'line-004-5', payslip_id: 'slip-payrun-102-emp-004', salary_rule_id: 'rule-013', name: 'Provident Fund', code: 'PF', category: 'DED', sequence: 50, amount: 14400, quantity: 1, calculation_details: 'Executive Basic (₹1,20,000) × 12%' },
];

export const getRawPayslips = () => MOCK_PAYSLIPS;
export const setRawPayslips = (slips) => { MOCK_PAYSLIPS = slips; };
export const getRawPayslipLines = () => MOCK_PAYSLIP_LINES;
export const setRawPayslipLines = (lines) => { MOCK_PAYSLIP_LINES = lines; };
