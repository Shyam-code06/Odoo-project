/**
 * Time Off Management Mock Datasets
 * Covers Leave Types, Employee Allocations, and Leave Requests.
 */

export let MOCK_TIME_OFF_TYPES = [
  { id: 'type-001', name: 'Annual Leave', code: 'AL', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-002', name: 'Sick Leave', code: 'SL', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-003', name: 'Casual Leave', code: 'CL', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-004', name: 'Unpaid Leave', code: 'UL', unit: 'days', requires_allocation: false, requires_approval: true, is_paid: false, is_active: true },
  { id: 'type-005', name: 'Hourly Compensatory Off', code: 'HCO', unit: 'hours', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-006', name: 'Legacy Sabbatical', code: 'LS', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: false },
];

export let MOCK_TIME_OFF_ALLOCATIONS = [
  {
    id: 'alloc-001',
    employee_id: 'emp-001',
    time_off_type_id: 'type-001',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 20,
    used_amount: 5,
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-01-02T10:00:00Z',
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-06-10T09:15:00Z',
  },
  {
    id: 'alloc-002',
    employee_id: 'emp-001',
    time_off_type_id: 'type-002',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 10,
    used_amount: 2,
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-01-02T10:05:00Z',
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-07-20T08:30:00Z',
  },
  {
    id: 'alloc-003',
    employee_id: 'emp-001',
    time_off_type_id: 'type-003',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 7,
    used_amount: 0,
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-01-02T10:10:00Z',
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-01-02T10:10:00Z',
  },
  {
    id: 'alloc-004',
    employee_id: 'emp-002',
    time_off_type_id: 'type-001',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 22,
    used_amount: 4,
    status: 'approved',
    approved_by: 'System Admin',
    approved_at: '2026-01-01T09:00:00Z',
    created_at: '2026-01-01T09:00:00Z',
    updated_at: '2026-03-25T14:00:00Z',
  },
  {
    id: 'alloc-005',
    employee_id: 'emp-003',
    time_off_type_id: 'type-001',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 18,
    used_amount: 0,
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-01-05T11:00:00Z',
    created_at: '2026-01-05T09:00:00Z',
    updated_at: '2026-01-05T11:00:00Z',
  },
  {
    id: 'alloc-006',
    employee_id: 'emp-003',
    time_off_type_id: 'type-005',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 40,
    used_amount: 8,
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-01-10T14:20:00Z',
    created_at: '2026-01-10T09:00:00Z',
    updated_at: '2026-08-04T10:00:00Z',
  },
  {
    id: 'alloc-007',
    employee_id: 'emp-001',
    time_off_type_id: 'type-005',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 16,
    used_amount: 0,
    status: 'pending',
    approved_by: null,
    approved_at: null,
    created_at: '2026-09-01T10:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'alloc-008',
    employee_id: 'emp-004',
    time_off_type_id: 'type-001',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    allocated_amount: 20,
    used_amount: 0,
    status: 'rejected',
    approved_by: 'Priya Mehta',
    approved_at: '2026-01-12T16:00:00Z',
    created_at: '2026-01-11T09:00:00Z',
    updated_at: '2026-01-12T16:00:00Z',
  },
];

export let MOCK_TIME_OFF_REQUESTS = [];

export const getRawTimeOffTypes = () => MOCK_TIME_OFF_TYPES;
export const setRawTimeOffTypes = (types) => { MOCK_TIME_OFF_TYPES = types; };
export const getRawTimeOffAllocations = () => MOCK_TIME_OFF_ALLOCATIONS;
export const setRawTimeOffAllocations = (allocations) => { MOCK_TIME_OFF_ALLOCATIONS = allocations; };
export const getRawTimeOffRequests = () => MOCK_TIME_OFF_REQUESTS;
export const setRawTimeOffRequests = (requests) => { MOCK_TIME_OFF_REQUESTS = requests; };
