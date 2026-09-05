/**
 * Payrun & Payrun Employee Mock Dataset
 */

export let MOCK_PAYRUNS = [
  {
    id: 'payrun-101',
    name: 'PAYRUN-2026-08',
    salary_structure_id: 'struct-001',
    period_start: '2026-08-01',
    period_end: '2026-08-31',
    status: 'paid',
    created_by: 'Admin User',
    computed_at: '2026-08-30T10:00:00Z',
    validated_at: '2026-08-31T14:00:00Z',
    paid_at: '2026-08-31T17:00:00Z',
    created_at: '2026-08-30T09:00:00Z',
    updated_at: '2026-08-31T17:00:00Z',
  },
  {
    id: 'payrun-102',
    name: 'PAYRUN-2026-09-EXEC',
    salary_structure_id: 'struct-002',
    period_start: '2026-09-01',
    period_end: '2026-09-30',
    status: 'computed',
    created_by: 'Admin User',
    computed_at: '2026-09-02T10:00:00Z',
    validated_at: null,
    paid_at: null,
    created_at: '2026-09-02T09:00:00Z',
    updated_at: '2026-09-02T10:00:00Z',
  },
];

export let MOCK_PAYRUN_EMPLOYEES = [
  { id: 'pre-101', payrun_id: 'payrun-101', employee_id: 'emp-001', contract_id: 'con-001', status: 'computed' },
  { id: 'pre-102', payrun_id: 'payrun-101', employee_id: 'emp-002', contract_id: 'con-002', status: 'computed' },
  { id: 'pre-103', payrun_id: 'payrun-101', employee_id: 'emp-003', contract_id: 'con-003', status: 'computed' },
  { id: 'pre-104', payrun_id: 'payrun-101', employee_id: 'emp-005', contract_id: 'con-005', status: 'computed' },
  { id: 'pre-105', payrun_id: 'payrun-101', employee_id: 'emp-006', contract_id: 'con-006', status: 'computed' },
  { id: 'pre-106', payrun_id: 'payrun-101', employee_id: 'emp-008', contract_id: 'con-008', status: 'computed' },
  { id: 'pre-201', payrun_id: 'payrun-102', employee_id: 'emp-004', contract_id: 'con-004', status: 'computed' },
];

export const getRawPayruns = () => MOCK_PAYRUNS;
export const setRawPayruns = (payruns) => { MOCK_PAYRUNS = payruns; };
export const getRawPayrunEmployees = () => MOCK_PAYRUN_EMPLOYEES;
export const setRawPayrunEmployees = (pres) => { MOCK_PAYRUN_EMPLOYEES = pres; };
