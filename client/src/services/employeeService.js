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
};

