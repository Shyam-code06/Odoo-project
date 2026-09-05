// Database-Aligned Master Datasets

let MOCK_DEPARTMENTS = [
  { id: 'dept-001', name: 'Engineering', code: 'ENG', description: 'Software engineering & product development', manager_id: 'emp-001', status: 'Active' },
  { id: 'dept-002', name: 'Human Resources', code: 'HR', description: 'Talent acquisition, operations & compliance', manager_id: 'emp-002', status: 'Active' },
  { id: 'dept-003', name: 'Finance & Payroll', code: 'FIN', description: 'Accounting, compensation & payroll', manager_id: 'emp-004', status: 'Active' },
  { id: 'dept-004', name: 'Product & Design', code: 'PD', description: 'Product management & UI/UX design', manager_id: 'emp-006', status: 'Active' },
  { id: 'dept-005', name: 'Marketing & Sales', code: 'MKT', description: 'Growth, brand & business development', manager_id: null, status: 'Active' },
];

let MOCK_JOB_POSITIONS = [
  { id: 'pos-001', title: 'Software Engineer', code: 'SE', department_id: 'dept-001', description: 'Develop and maintain web software applications.', status: 'Active' },
  { id: 'pos-002', title: 'Senior Frontend Engineer', code: 'SFE', department_id: 'dept-001', description: 'Lead frontend architecture and modern web apps.', status: 'Active' },
  { id: 'pos-003', title: 'Backend Tech Lead', code: 'BTL', department_id: 'dept-001', description: 'Design microservices and cloud infrastructure.', status: 'Active' },
  { id: 'pos-004', title: 'HR Operations Specialist', code: 'HRS', department_id: 'dept-002', description: 'Manage employee onboarding and HR workflows.', status: 'Active' },
  { id: 'pos-005', title: 'HR Manager', code: 'HRM', department_id: 'dept-002', description: 'Oversee human resources department and policy.', status: 'Active' },
  { id: 'pos-006', title: 'Payroll Analyst', code: 'PA', department_id: 'dept-003', description: 'Process salary calculations and tax compliance.', status: 'Active' },
  { id: 'pos-007', title: 'Finance Lead', code: 'FL', department_id: 'dept-003', description: 'Manage corporate budget and financial planning.', status: 'Active' },
  { id: 'pos-008', title: 'Product Designer', code: 'PD', department_id: 'dept-004', description: 'Create user interfaces and design systems.', status: 'Active' },
  { id: 'pos-009', title: 'Product Manager', code: 'PM', department_id: 'dept-004', description: 'Define product strategy and feature roadmaps.', status: 'Active' },
  { id: 'pos-010', title: 'Marketing Executive', code: 'ME', department_id: 'dept-005', description: 'Execute brand marketing and customer outreach.', status: 'Active' },
];

let MOCK_WORKING_SCHEDULES = [
  {
    id: 'sched-001',
    name: 'Full-Time Standard',
    description: 'Standard 40-hour work week, Monday to Friday 09:30 to 18:30 with 1 hour lunch break.',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: true, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:30', endTime: '18:30', breakMinutes: 60 },
    ],
  },
  {
    id: 'sched-002',
    name: 'Flexi Shift',
    description: 'Flexible daytime shift, Monday to Friday 10:00 to 19:00 with 1 hour lunch break.',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: true, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '10:00', endTime: '19:00', breakMinutes: 60 },
    ],
  },
  {
    id: 'sched-003',
    name: 'Part-Time Morning',
    description: 'Part-time morning shift, Monday to Thursday 09:00 to 13:00 with 15 minute break.',
    timezone: 'Asia/Kolkata',
    status: 'Active',
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Tuesday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Wednesday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Thursday', isWorkingDay: true, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Friday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Saturday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
      { dayOfWeek: 'Sunday', isWorkingDay: false, startTime: '09:00', endTime: '13:00', breakMinutes: 15 },
    ],
  },
  {
    id: 'sched-004',
    name: 'Weekend Support Shift',
    description: 'Special weekend support schedule, Saturday and Sunday 10:00 to 18:00.',
    timezone: 'Asia/Kolkata',
    status: 'Inactive',
    created_at: '2024-05-10T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
    days: [
      { dayOfWeek: 'Monday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Tuesday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Wednesday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Thursday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Friday', isWorkingDay: false, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Saturday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
      { dayOfWeek: 'Sunday', isWorkingDay: true, startTime: '10:00', endTime: '18:00', breakMinutes: 60 },
    ],
  },
];

let MOCK_EMPLOYEES = [
  {
    id: 'emp-001',
    employee_code: 'EMP-2026-001',
    first_name: 'Rahul',
    last_name: 'Sharma',
    email: 'employee@hrms.demo',
    phone: '+91 98765 43210',
    date_of_birth: '1995-04-12',
    address: '123 Tech Park Road, Bangalore, Karnataka',
    department_id: 'dept-001',
    job_position_id: 'pos-001',
    manager_id: 'emp-002',
    joining_date: '2024-06-15',
    employment_status: 'Active', // Active | Inactive | Terminated
    working_schedule_id: 'sched-001',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-06-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-002',
    employee_code: 'EMP-2026-002',
    first_name: 'Priya',
    last_name: 'Mehta',
    email: 'hrmanager@hrms.demo',
    phone: '+91 98765 43211',
    date_of_birth: '1990-08-25',
    address: '456 HR Heights, Mumbai, Maharashtra',
    department_id: 'dept-002',
    job_position_id: 'pos-005',
    manager_id: null,
    joining_date: '2023-03-10',
    employment_status: 'Active',
    working_schedule_id: 'sched-001',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    created_at: '2023-03-10T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-003',
    employee_code: 'EMP-2026-003',
    first_name: 'Arjun',
    last_name: 'Patel',
    email: 'payrolluser@hrms.demo',
    phone: '+91 98765 43212',
    date_of_birth: '1992-11-05',
    address: '789 Finance Towers, Ahmedabad, Gujarat',
    department_id: 'dept-003',
    job_position_id: 'pos-006',
    manager_id: 'emp-004',
    joining_date: '2024-01-20',
    employment_status: 'Active',
    working_schedule_id: 'sched-002',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: '2024-01-20T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-004',
    employee_code: 'EMP-2026-004',
    first_name: 'Neha',
    last_name: 'Shah',
    email: 'payrollmanager@hrms.demo',
    phone: '+91 98765 43213',
    date_of_birth: '1988-02-18',
    address: '101 Corporate Hub, New Delhi',
    department_id: 'dept-003',
    job_position_id: 'pos-007',
    manager_id: null,
    joining_date: '2022-11-12',
    employment_status: 'Active',
    working_schedule_id: 'sched-001',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: '2022-11-12T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-005',
    employee_code: 'EMP-2026-005',
    first_name: 'Eleanor',
    last_name: 'Vance',
    email: 'eleanor.vance@company.demo',
    phone: '+91 98765 43214',
    date_of_birth: '1996-07-30',
    address: '202 Silicon Valley Enclave, Pune, Maharashtra',
    department_id: 'dept-001',
    job_position_id: 'pos-002',
    manager_id: 'emp-001',
    joining_date: '2026-09-01',
    employment_status: 'Active',
    working_schedule_id: 'sched-001',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    created_at: '2026-09-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-006',
    employee_code: 'EMP-2026-006',
    first_name: 'Marcus',
    last_name: 'Chen',
    email: 'marcus.chen@company.demo',
    phone: '+91 98765 43215',
    date_of_birth: '1994-03-14',
    address: '303 Design Studio, Hyderabad, Telangana',
    department_id: 'dept-004',
    job_position_id: 'pos-008',
    manager_id: null,
    joining_date: '2025-02-14',
    employment_status: 'Active',
    working_schedule_id: 'sched-002',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    created_at: '2025-02-14T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-007',
    employee_code: 'EMP-2026-007',
    first_name: 'Amit',
    last_name: 'Verma',
    email: 'amit.verma@company.demo',
    phone: '+91 98765 43216',
    date_of_birth: '1989-10-10',
    address: '404 Old Town Road, Jaipur, Rajasthan',
    department_id: 'dept-005',
    job_position_id: 'pos-010',
    manager_id: null,
    joining_date: '2023-08-01',
    employment_status: 'Inactive',
    working_schedule_id: 'sched-001',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    created_at: '2023-08-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'emp-008',
    employee_code: 'EMP-2026-008',
    first_name: 'Kavita',
    last_name: 'Rao',
    email: 'kavita.rao@company.demo',
    phone: '+91 98765 43217',
    date_of_birth: '1991-05-19',
    address: '505 Commercial Lane, Chennai, Tamil Nadu',
    department_id: 'dept-002',
    job_position_id: 'pos-004',
    manager_id: 'emp-002',
    joining_date: '2021-04-10',
    employment_status: 'Terminated',
    working_schedule_id: 'sched-001',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    created_at: '2021-04-10T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
];

let MOCK_ATTENDANCE = [
  {
    id: 'att-001',
    employee_id: 'emp-001',
    attendance_date: '2026-09-05',
    check_in: '2026-09-05T09:32:00Z',
    check_out: '2026-09-05T18:34:00Z',
    worked_minutes: 542,
    status: 'Present',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-05T09:32:00Z',
    updated_at: '2026-09-05T18:34:00Z',
  },
  {
    id: 'att-002',
    employee_id: 'emp-002',
    attendance_date: '2026-09-05',
    check_in: '2026-09-05T09:58:00Z',
    check_out: '2026-09-05T18:30:00Z',
    worked_minutes: 512,
    status: 'Late',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-05T09:58:00Z',
    updated_at: '2026-09-05T18:30:00Z',
  },
  {
    id: 'att-003',
    employee_id: 'emp-003',
    attendance_date: '2026-09-05',
    check_in: '2026-09-05T09:30:00Z',
    check_out: null, // Missing check-out exception
    worked_minutes: 0,
    status: 'Present',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-05T09:30:00Z',
    updated_at: '2026-09-05T09:30:00Z',
  },
  {
    id: 'att-004',
    employee_id: 'emp-004',
    attendance_date: '2026-09-05',
    check_in: '2026-09-05T09:15:00Z',
    check_out: '2026-09-05T18:30:00Z',
    worked_minutes: 555,
    status: 'Present',
    corrected_by: 'HR Manager',
    correction_reason: 'System clock-in latency adjustment confirmed with team lead.',
    created_at: '2026-09-05T09:15:00Z',
    updated_at: '2026-09-05T10:45:00Z',
  },
  {
    id: 'att-005',
    employee_id: 'emp-005',
    attendance_date: '2026-09-05',
    check_in: '2026-09-05T09:30:00Z',
    check_out: '2026-09-05T18:30:00Z',
    worked_minutes: 540,
    status: 'Present',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-05T09:30:00Z',
    updated_at: '2026-09-05T18:30:00Z',
  },
  {
    id: 'att-006',
    employee_id: 'emp-006',
    attendance_date: '2026-09-05',
    check_in: '2026-09-05T10:15:00Z',
    check_out: '2026-09-05T19:00:00Z',
    worked_minutes: 525,
    status: 'Late',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-05T10:15:00Z',
    updated_at: '2026-09-05T19:00:00Z',
  },
  {
    id: 'att-007',
    employee_id: 'emp-001',
    attendance_date: '2026-09-04',
    check_in: '2026-09-04T09:28:00Z',
    check_out: '2026-09-04T18:31:00Z',
    worked_minutes: 543,
    status: 'Present',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-04T09:28:00Z',
    updated_at: '2026-09-04T18:31:00Z',
  },
  {
    id: 'att-008',
    employee_id: 'emp-002',
    attendance_date: '2026-09-04',
    check_in: '2026-09-04T09:30:00Z',
    check_out: '2026-09-04T18:30:00Z',
    worked_minutes: 540,
    status: 'Present',
    corrected_by: null,
    correction_reason: null,
    created_at: '2026-09-04T09:30:00Z',
    updated_at: '2026-09-04T18:30:00Z',
  },
];

let MOCK_TIME_OFF_TYPES = [
  { id: 'type-001', name: 'Annual Leave', code: 'AL', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-002', name: 'Sick Leave', code: 'SL', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-003', name: 'Casual Leave', code: 'CL', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-004', name: 'Unpaid Leave', code: 'UL', unit: 'days', requires_allocation: false, requires_approval: true, is_paid: false, is_active: true },
  { id: 'type-005', name: 'Hourly Compensatory Off', code: 'HCO', unit: 'hours', requires_allocation: true, requires_approval: true, is_paid: true, is_active: true },
  { id: 'type-006', name: 'Legacy Sabbatical', code: 'LS', unit: 'days', requires_allocation: true, requires_approval: true, is_paid: true, is_active: false },
];

let MOCK_TIME_OFF_ALLOCATIONS = [
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

let MOCK_TIME_OFF_REQUESTS = [
  {
    id: 'req-001',
    employee_id: 'emp-001',
    time_off_type_id: 'type-001',
    allocation_id: 'alloc-001',
    start_date: '2026-03-10',
    end_date: '2026-03-12',
    duration: 3,
    reason: 'Family vacation and personal travel',
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-03-05T11:30:00Z',
    created_at: '2026-03-04T09:00:00Z',
    updated_at: '2026-03-05T11:30:00Z',
  },
  {
    id: 'req-002',
    employee_id: 'emp-001',
    time_off_type_id: 'type-001',
    allocation_id: 'alloc-001',
    start_date: '2026-06-15',
    end_date: '2026-06-16',
    duration: 2,
    reason: 'Personal work at hometown',
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-06-10T09:15:00Z',
    created_at: '2026-06-08T10:00:00Z',
    updated_at: '2026-06-10T09:15:00Z',
  },
  {
    id: 'req-003',
    employee_id: 'emp-001',
    time_off_type_id: 'type-002',
    allocation_id: 'alloc-002',
    start_date: '2026-07-20',
    end_date: '2026-07-21',
    duration: 2,
    reason: 'Flu and rest advised by physician',
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-07-20T08:30:00Z',
    created_at: '2026-07-19T18:00:00Z',
    updated_at: '2026-07-20T08:30:00Z',
  },
  {
    id: 'req-004',
    employee_id: 'emp-001',
    time_off_type_id: 'type-001',
    allocation_id: 'alloc-001',
    start_date: '2026-09-10',
    end_date: '2026-09-12',
    duration: 3,
    reason: 'Festival holidays with family',
    status: 'pending',
    approved_by: null,
    approved_at: null,
    created_at: '2026-09-01T11:00:00Z',
    updated_at: '2026-09-01T11:00:00Z',
  },
  {
    id: 'req-005',
    employee_id: 'emp-002',
    time_off_type_id: 'type-001',
    allocation_id: 'alloc-004',
    start_date: '2026-04-01',
    end_date: '2026-04-04',
    duration: 4,
    reason: 'Spring vacation',
    status: 'approved',
    approved_by: 'System Admin',
    approved_at: '2026-03-25T14:00:00Z',
    created_at: '2026-03-20T10:00:00Z',
    updated_at: '2026-03-25T14:00:00Z',
  },
  {
    id: 'req-006',
    employee_id: 'emp-003',
    time_off_type_id: 'type-005',
    allocation_id: 'alloc-006',
    start_date: '2026-08-05',
    end_date: '2026-08-05',
    duration: 8,
    reason: 'Compensatory off for weekend deployment support',
    status: 'approved',
    approved_by: 'Priya Mehta',
    approved_at: '2026-08-04T10:00:00Z',
    created_at: '2026-08-03T15:00:00Z',
    updated_at: '2026-08-04T10:00:00Z',
  },
  {
    id: 'req-007',
    employee_id: 'emp-003',
    time_off_type_id: 'type-001',
    allocation_id: 'alloc-005',
    start_date: '2026-09-15',
    end_date: '2026-09-18',
    duration: 4,
    reason: 'Extended weekend trip',
    status: 'pending',
    approved_by: null,
    approved_at: null,
    created_at: '2026-09-02T09:30:00Z',
    updated_at: '2026-09-02T09:30:00Z',
  },
  {
    id: 'req-008',
    employee_id: 'emp-001',
    time_off_type_id: 'type-003',
    allocation_id: 'alloc-003',
    start_date: '2026-02-14',
    end_date: '2026-02-14',
    duration: 1,
    reason: 'Personal emergency',
    status: 'rejected',
    approved_by: 'Priya Mehta',
    approved_at: '2026-02-13T12:00:00Z',
    rejected_reason: 'High priority project release scheduled on this date.',
    created_at: '2026-02-12T14:00:00Z',
    updated_at: '2026-02-13T12:00:00Z',
  },
];

let MOCK_SALARY_RULE_CATEGORIES = [
  { id: 'cat-001', name: 'Basic', code: 'BASIC', description: 'Base salary component' },
  { id: 'cat-002', name: 'Allowance', code: 'ALW', description: 'Supplemental allowance earnings' },
  { id: 'cat-003', name: 'Gross', code: 'GROSS', description: 'Gross salary calculation' },
  { id: 'cat-004', name: 'Deduction', code: 'DED', description: 'Statutory or voluntary payroll deductions' },
  { id: 'cat-005', name: 'Net', code: 'NET', description: 'Final net take-home salary' },
  { id: 'cat-006', name: 'Contribution', code: 'CNT', description: 'Employer statutory contributions' },
];

let MOCK_SALARY_STRUCTURES = [
  {
    id: 'struct-001',
    name: 'Regular Employee Salary Structure',
    code: 'REG',
    description: 'Standard salary structure for regular full-time Indian employees. Includes Basic, HRA, Conveyance, PF, and Professional Tax.',
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'struct-002',
    name: 'Executive Leadership Structure',
    code: 'EXEC',
    description: 'Senior management and leadership salary structure with special executive allowances and performance incentives.',
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'struct-003',
    name: 'Contract Staff Structure',
    code: 'CONT',
    description: 'Simplified flat-rate compensation structure for temporary and contract workers.',
    is_active: true,
    created_at: '2024-03-20T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'struct-004',
    name: 'Legacy Internship Structure',
    code: 'INT',
    description: 'Deprecated internship stipend compensation structure.',
    is_active: false,
    created_at: '2024-05-10T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
];

let MOCK_SALARY_RULES = [
  {
    id: 'rule-001',
    salary_structure_id: 'struct-001',
    category_id: 'cat-001',
    name: 'Basic Salary',
    code: 'BASIC',
    sequence: 10,
    calculation_type: 'fixed',
    value: 40000,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-002',
    salary_structure_id: 'struct-001',
    category_id: 'cat-002',
    name: 'House Rent Allowance (HRA)',
    code: 'HRA',
    sequence: 20,
    calculation_type: 'percentage',
    value: 40,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-003',
    salary_structure_id: 'struct-001',
    category_id: 'cat-002',
    name: 'Conveyance Allowance',
    code: 'CONV',
    sequence: 30,
    calculation_type: 'fixed',
    value: 3000,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-004',
    salary_structure_id: 'struct-001',
    category_id: 'cat-003',
    name: 'Gross Salary',
    code: 'GROSS',
    sequence: 40,
    calculation_type: 'formula',
    value: null,
    condition_expression: null,
    formula_expression: 'BASIC + HRA + CONV',
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-005',
    salary_structure_id: 'struct-001',
    category_id: 'cat-004',
    name: 'Provident Fund (PF)',
    code: 'PF',
    sequence: 50,
    calculation_type: 'percentage',
    value: 12,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-006',
    salary_structure_id: 'struct-001',
    category_id: 'cat-004',
    name: 'Professional Tax',
    code: 'PT',
    sequence: 60,
    calculation_type: 'fixed',
    value: 200,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-007',
    salary_structure_id: 'struct-001',
    category_id: 'cat-004',
    name: 'Total Deductions',
    code: 'DEDUCTIONS',
    sequence: 70,
    calculation_type: 'formula',
    value: null,
    condition_expression: null,
    formula_expression: 'PF + PT',
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-008',
    salary_structure_id: 'struct-001',
    category_id: 'cat-005',
    name: 'Net Salary',
    code: 'NET',
    sequence: 80,
    calculation_type: 'formula',
    value: null,
    condition_expression: null,
    formula_expression: 'GROSS - DEDUCTIONS',
    is_active: true,
    created_at: '2024-01-01T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-009',
    salary_structure_id: 'struct-002',
    category_id: 'cat-001',
    name: 'Executive Basic',
    code: 'BASIC',
    sequence: 10,
    calculation_type: 'fixed',
    value: 90000,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-010',
    salary_structure_id: 'struct-002',
    category_id: 'cat-002',
    name: 'Executive HRA',
    code: 'HRA',
    sequence: 20,
    calculation_type: 'percentage',
    value: 50,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-011',
    salary_structure_id: 'struct-002',
    category_id: 'cat-002',
    name: 'Special Executive Allowance',
    code: 'SEA',
    sequence: 30,
    calculation_type: 'fixed',
    value: 25000,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-012',
    salary_structure_id: 'struct-002',
    category_id: 'cat-003',
    name: 'Gross Salary',
    code: 'GROSS',
    sequence: 40,
    calculation_type: 'formula',
    value: null,
    condition_expression: null,
    formula_expression: 'BASIC + HRA + SEA',
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-013',
    salary_structure_id: 'struct-002',
    category_id: 'cat-004',
    name: 'Provident Fund',
    code: 'PF',
    sequence: 50,
    calculation_type: 'percentage',
    value: 12,
    condition_expression: null,
    formula_expression: null,
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
  {
    id: 'rule-014',
    salary_structure_id: 'struct-002',
    category_id: 'cat-005',
    name: 'Net Salary',
    code: 'NET',
    sequence: 60,
    calculation_type: 'formula',
    value: null,
    condition_expression: null,
    formula_expression: 'GROSS - PF',
    is_active: true,
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2026-09-01T10:00:00Z',
  },
];

let MOCK_CONTRACTS = [
  {
    id: 'con-001',
    contract_code: 'CON-001',
    employee_id: 'emp-001',
    salary_structure_id: 'struct-001',
    wage: 50000,
    employment_type: 'Full-time',
    start_date: '2024-01-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 'con-002',
    contract_code: 'CON-002',
    employee_id: 'emp-002',
    salary_structure_id: 'struct-001',
    wage: 65000,
    employment_type: 'Full-time',
    start_date: '2024-02-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 'con-003',
    contract_code: 'CON-003',
    employee_id: 'emp-003',
    salary_structure_id: 'struct-001',
    wage: 75000,
    employment_type: 'Full-time',
    start_date: '2024-03-01',
    end_date: null,
    status: 'Active',
    has_bank_details: false, // Flagged for missing bank details warning
  },
  {
    id: 'con-004',
    contract_code: 'CON-004',
    employee_id: 'emp-004',
    salary_structure_id: 'struct-002',
    wage: 120000,
    employment_type: 'Full-time',
    start_date: '2023-06-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 'con-005',
    contract_code: 'CON-005',
    employee_id: 'emp-005',
    salary_structure_id: 'struct-001',
    wage: 45000,
    employment_type: 'Full-time',
    start_date: '2024-05-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 'con-006',
    contract_code: 'CON-006',
    employee_id: 'emp-006',
    salary_structure_id: 'struct-001',
    wage: 80000,
    employment_type: 'Full-time',
    start_date: '2024-04-15',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 'con-007',
    contract_code: 'CON-007',
    employee_id: 'emp-007',
    salary_structure_id: 'struct-003',
    wage: 35000,
    employment_type: 'Contract',
    start_date: '2024-06-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
  {
    id: 'con-008',
    contract_code: 'CON-008',
    employee_id: 'emp-008',
    salary_structure_id: 'struct-001',
    wage: 55000,
    employment_type: 'Full-time',
    start_date: '2024-07-01',
    end_date: null,
    status: 'Active',
    has_bank_details: true,
  },
];

let MOCK_PAYRUNS = [
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

let MOCK_PAYRUN_EMPLOYEES = [
  { id: 'pre-101', payrun_id: 'payrun-101', employee_id: 'emp-001', contract_id: 'con-001', status: 'computed' },
  { id: 'pre-102', payrun_id: 'payrun-101', employee_id: 'emp-002', contract_id: 'con-002', status: 'computed' },
  { id: 'pre-103', payrun_id: 'payrun-101', employee_id: 'emp-003', contract_id: 'con-003', status: 'computed' },
  { id: 'pre-104', payrun_id: 'payrun-101', employee_id: 'emp-005', contract_id: 'con-005', status: 'computed' },
  { id: 'pre-105', payrun_id: 'payrun-101', employee_id: 'emp-006', contract_id: 'con-006', status: 'computed' },
  { id: 'pre-106', payrun_id: 'payrun-101', employee_id: 'emp-008', contract_id: 'con-008', status: 'computed' },
  { id: 'pre-201', payrun_id: 'payrun-102', employee_id: 'emp-004', contract_id: 'con-004', status: 'computed' },
];

let MOCK_PAYSLIPS = [
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

let MOCK_PAYSLIP_LINES = [
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

// Helper to populate reference entity names
const populateEmployee = (emp) => {
  if (!emp) return null;
  const dept = MOCK_DEPARTMENTS.find((d) => d.id === emp.department_id);
  const pos = MOCK_JOB_POSITIONS.find((p) => p.id === emp.job_position_id);
  const mgr = MOCK_EMPLOYEES.find((m) => m.id === emp.manager_id);
  const sched = MOCK_WORKING_SCHEDULES.find((s) => s.id === emp.working_schedule_id);

  return {
    ...emp,
    fullName: `${emp.first_name} ${emp.last_name}`,
    departmentName: dept ? dept.name : 'Unassigned',
    jobPositionTitle: pos ? pos.title : 'Unassigned',
    managerName: mgr ? `${mgr.first_name} ${mgr.last_name}` : 'None (Top Level)',
    workingScheduleName: sched ? sched.name : 'Standard Shift',
    relatedCounts: {
      contracts: 2,
      attendance: 24,
      timeOff: 3,
      allocations: 4,
    },
  };
};

export const employeeService = {
  getEmployees: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = MOCK_EMPLOYEES.map(populateEmployee);

        // Search filter (Name, Code, Email)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          result = result.filter(
            (e) =>
              e.fullName.toLowerCase().includes(q) ||
              e.employee_code.toLowerCase().includes(q) ||
              e.email.toLowerCase().includes(q)
          );
        }

        // Filters
        if (params.department_id) {
          result = result.filter((e) => e.department_id === params.department_id);
        }
        if (params.job_position_id) {
          result = result.filter((e) => e.job_position_id === params.job_position_id);
        }
        if (params.manager_id) {
          result = result.filter((e) => e.manager_id === params.manager_id);
        }
        if (params.employment_status) {
          result = result.filter(
            (e) => e.employment_status.toLowerCase() === params.employment_status.toLowerCase()
          );
        }
        if (params.working_schedule_id) {
          result = result.filter((e) => e.working_schedule_id === params.working_schedule_id);
        }

        // Sorting
        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          result.sort((a, b) => {
            const valA = a[key] || '';
            const valB = b[key] || '';
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }

        // Pagination
        const total = result.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const paginated = result.slice(startIndex, startIndex + pageSize);

        resolve({
          data: paginated,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        });
      }, 250);
    });
  },

  getEmployeeById: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const emp = MOCK_EMPLOYEES.find((e) => e.id === id);
        resolve(emp ? populateEmployee(emp) : null);
      }, 200);
    });
  },

  createEmployee: async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newId = `emp-${Date.now()}`;
        const autoCode = data.employee_code || `EMP-2026-${String(MOCK_EMPLOYEES.length + 1).padStart(3, '0')}`;

        const newEmp = {
          id: newId,
          employee_code: autoCode,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
          department_id: data.department_id || 'dept-001',
          job_position_id: data.job_position_id || 'pos-001',
          manager_id: data.manager_id || null,
          joining_date: data.joining_date || new Date().toISOString().split('T')[0],
          employment_status: data.employment_status || 'Active',
          working_schedule_id: data.working_schedule_id || 'sched-001',
          avatar: data.avatar || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        MOCK_EMPLOYEES.unshift(newEmp);
        resolve({ success: true, employee: populateEmployee(newEmp) });
      }, 300);
    });
  },

  updateEmployee: async (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const idx = MOCK_EMPLOYEES.findIndex((e) => e.id === id);
        if (idx === -1) {
          resolve({ success: false, error: 'Employee record not found.' });
          return;
        }

        const updated = {
          ...MOCK_EMPLOYEES[idx],
          ...data,
          updated_at: new Date().toISOString(),
        };

        MOCK_EMPLOYEES[idx] = updated;
        resolve({ success: true, employee: populateEmployee(updated) });
      }, 300);
    });
  },

  deleteEmployee: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        MOCK_EMPLOYEES = MOCK_EMPLOYEES.filter((e) => e.id !== id);
        resolve({ success: true });
      }, 200);
    });
  },

  // Lookup Entities Option Getters
  getDepartmentOptions: async () => {
    return MOCK_DEPARTMENTS;
  },

  getJobPositionOptions: async (departmentId = null) => {
    if (departmentId) {
      return MOCK_JOB_POSITIONS.filter((p) => p.department_id === departmentId);
    }
    return MOCK_JOB_POSITIONS;
  },

  getManagerOptions: async (excludeEmployeeId = null) => {
    return MOCK_EMPLOYEES.filter((e) => e.id !== excludeEmployeeId).map((e) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`,
    }));
  },

  getScheduleOptions: async () => {
    return MOCK_WORKING_SCHEDULES;
  },

  // Raw State Accessors for Master Data Services
  _getRawDepartments: () => MOCK_DEPARTMENTS,
  _setRawDepartments: (depts) => { MOCK_DEPARTMENTS = depts; },
  _getRawJobPositions: () => MOCK_JOB_POSITIONS,
  _setRawJobPositions: (positions) => { MOCK_JOB_POSITIONS = positions; },
  _getRawEmployees: () => MOCK_EMPLOYEES,
  _getRawSchedules: () => MOCK_WORKING_SCHEDULES,
  _setRawSchedules: (schedules) => { MOCK_WORKING_SCHEDULES = schedules; },
  _getRawAttendance: () => MOCK_ATTENDANCE,
  _setRawAttendance: (records) => { MOCK_ATTENDANCE = records; },
  _getRawTimeOffTypes: () => MOCK_TIME_OFF_TYPES,
  _setRawTimeOffTypes: (types) => { MOCK_TIME_OFF_TYPES = types; },
  _getRawTimeOffAllocations: () => MOCK_TIME_OFF_ALLOCATIONS,
  _setRawTimeOffAllocations: (allocations) => { MOCK_TIME_OFF_ALLOCATIONS = allocations; },
  _getRawTimeOffRequests: () => MOCK_TIME_OFF_REQUESTS,
  _setRawTimeOffRequests: (requests) => { MOCK_TIME_OFF_REQUESTS = requests; },
  _getRawSalaryStructures: () => MOCK_SALARY_STRUCTURES,
  _setRawSalaryStructures: (structures) => { MOCK_SALARY_STRUCTURES = structures; },
  _getRawSalaryRuleCategories: () => MOCK_SALARY_RULE_CATEGORIES,
  _setRawSalaryRuleCategories: (categories) => { MOCK_SALARY_RULE_CATEGORIES = categories; },
  _getRawSalaryRules: () => MOCK_SALARY_RULES,
  _setRawSalaryRules: (rules) => { MOCK_SALARY_RULES = rules; },
  _getRawContracts: () => MOCK_CONTRACTS,
  _setRawContracts: (contracts) => { MOCK_CONTRACTS = contracts; },
  _getRawPayruns: () => MOCK_PAYRUNS,
  _setRawPayruns: (payruns) => { MOCK_PAYRUNS = payruns; },
  _getRawPayrunEmployees: () => MOCK_PAYRUN_EMPLOYEES,
  _setRawPayrunEmployees: (pres) => { MOCK_PAYRUN_EMPLOYEES = pres; },
  _getRawPayslips: () => MOCK_PAYSLIPS,
  _setRawPayslips: (slips) => { MOCK_PAYSLIPS = slips; },
  _getRawPayslipLines: () => MOCK_PAYSLIP_LINES,
  _setRawPayslipLines: (lines) => { MOCK_PAYSLIP_LINES = lines; },
};


