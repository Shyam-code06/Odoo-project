import { ROLES, PERMISSIONS } from '../config/permissions';

export const MOCK_STATS_BY_ROLE = {
  [ROLES.EMPLOYEE]: [
    {
      id: 'stat_emp_1',
      title: 'Today Check-In',
      value: 'Not Checked In',
      description: '0h worked today',
      iconName: 'Clock',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_emp_2',
      title: 'Leave Balance',
      value: '0 Days',
      description: 'No leave allocated',
      iconName: 'Palmtree',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_emp_3',
      title: 'Pending Requests',
      value: '0 Requests',
      description: 'No pending leave requests',
      iconName: 'CalendarDays',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_emp_4',
      title: 'Latest Payslip',
      value: 'None',
      description: 'No payslip issued',
      iconName: 'FileSpreadsheet',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.HR_MANAGER]: [
    {
      id: 'stat_hrm_1',
      title: 'Total Employees',
      value: '3',
      description: 'Total workforce headcount',
      iconName: 'Users',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_hrm_2',
      title: 'Active Employees',
      value: '3',
      description: 'Currently operational',
      iconName: 'UserCheck',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_hrm_3',
      title: 'Employees On Leave',
      value: '0',
      description: 'Approved time off',
      iconName: 'Palmtree',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_hrm_4',
      title: 'Pending Time Off',
      value: '0 Requests',
      description: 'Awaiting HR approval',
      iconName: 'CalendarDays',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.HR_PAYROLL_USER]: [
    {
      id: 'stat_pru_1',
      title: 'Total Payroll Employees',
      value: '3',
      description: 'Included in active cycle',
      iconName: 'Users',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_pru_2',
      title: 'Processed Payslips',
      value: '0',
      description: 'Payslips generated',
      iconName: 'Receipt',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_pru_3',
      title: 'Pending Processing',
      value: '3 Records',
      description: 'Verification needed',
      iconName: 'Clock',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_pru_4',
      title: 'Monthly Net Payroll',
      value: '₹0',
      description: 'Current cycle',
      iconName: 'CircleDollarSign',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.HR_PAYROLL_MANAGER]: [
    {
      id: 'stat_prm_1',
      title: 'Gross Monthly Payroll',
      value: '₹0',
      description: 'Total salary disbursement',
      iconName: 'CircleDollarSign',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_prm_2',
      title: 'Salary Structures',
      value: '2 Active',
      description: 'Pay grade frameworks',
      iconName: 'Layers',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_prm_3',
      title: 'Salary Rules',
      value: '7 Rules',
      description: 'Allowances & deductions',
      iconName: 'Sliders',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_prm_4',
      title: 'Payrun Status',
      value: 'No Active Run',
      description: 'Current cycle status',
      iconName: 'CheckCircle2',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.ADMIN]: [
    {
      id: 'stat_adm_1',
      title: 'Total Employees',
      value: '3',
      description: 'All departments',
      iconName: 'Users',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_adm_2',
      title: 'System Users',
      value: '6 Accounts',
      description: 'Active portal users',
      iconName: 'UserCheck',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_adm_3',
      title: 'Departments',
      value: '4 Active',
      description: 'Organizational units',
      iconName: 'Building2',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_adm_4',
      title: 'Monthly Payroll',
      value: '₹0',
      description: 'Current cycle disbursement',
      iconName: 'CircleDollarSign',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
};

export const MOCK_ATTENDANCE_SUMMARY = {
  present: 0,
  late: 0,
  absent: 0,
  onLeave: 0,
  wfh: 0,
  totalExpected: 3,
  weeklyTrend: [
    { day: 'Mon', present: 0, absent: 0, late: 0 },
    { day: 'Tue', present: 0, absent: 0, late: 0 },
    { day: 'Wed', present: 0, absent: 0, late: 0 },
    { day: 'Thu', present: 0, absent: 0, late: 0 },
    { day: 'Fri', present: 0, absent: 0, late: 0 },
  ],
};

let rawDashboardTimeOffRequests = [];

export const MOCK_UPCOMING_EVENTS = [];

export const MOCK_RECENT_ACTIVITIES = [];

export const MOCK_PAYROLL_SUMMARY = {
  period: 'Current Cycle',
  totalEmployees: 3,
  grossPayroll: 0,
  processedCount: 0,
  pendingCount: 3,
  status: 'No Active Run',
  payrunId: null,
};

export const MOCK_NEEDS_ATTENTION_BY_ROLE = {
  [ROLES.EMPLOYEE]: [],
  [ROLES.HR_MANAGER]: [],
  [ROLES.HR_PAYROLL_USER]: [],
  [ROLES.HR_PAYROLL_MANAGER]: [],
  [ROLES.ADMIN]: [],
};

export const MOCK_QUICK_ACTIONS_BY_ROLE = {
  [ROLES.EMPLOYEE]: [
    { id: 'qa_1', label: 'Request Time Off', route: '/my-time-off', iconName: 'Palmtree', permission: PERMISSIONS.MY_TIME_OFF_VIEW },
    { id: 'qa_2', label: 'View Attendance', route: '/my-attendance', iconName: 'Clock', permission: PERMISSIONS.MY_ATTENDANCE_VIEW },
    { id: 'qa_3', label: 'View Payslips', route: '/my-payslips', iconName: 'FileSpreadsheet', permission: PERMISSIONS.MY_PAYSLIPS_VIEW },
    { id: 'qa_4', label: 'View Profile', route: '/profile', iconName: 'User', permission: PERMISSIONS.PROFILE_VIEW },
  ],
  [ROLES.HR_MANAGER]: [
    { id: 'qa_1', label: 'Add Employee', route: '/employees/new', iconName: 'UserPlus', permission: PERMISSIONS.EMPLOYEES_CREATE },
    { id: 'qa_2', label: 'Review Time Off', route: '/time-off/requests', iconName: 'CheckSquare', permission: PERMISSIONS.TIME_OFF_VIEW },
    { id: 'qa_3', label: 'View Attendance', route: '/attendance', iconName: 'Clock', permission: PERMISSIONS.ATTENDANCE_VIEW },
    { id: 'qa_4', label: 'View Reports', route: '/reports', iconName: 'BarChart3', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  [ROLES.HR_PAYROLL_USER]: [
    { id: 'qa_1', label: 'View Payruns', route: '/payroll/payruns', iconName: 'Receipt', permission: PERMISSIONS.PAYRUNS_VIEW },
    { id: 'qa_2', label: 'View Payslips', route: '/payroll/payslips', iconName: 'FileSpreadsheet', permission: PERMISSIONS.PAYSLIPS_VIEW },
    { id: 'qa_3', label: 'View Employees', route: '/employees', iconName: 'Users', permission: PERMISSIONS.EMPLOYEES_VIEW },
  ],
  [ROLES.HR_PAYROLL_MANAGER]: [
    { id: 'qa_1', label: 'Create Payrun', route: '/payroll/payruns/new', iconName: 'Plus', permission: PERMISSIONS.PAYRUNS_CREATE },
    { id: 'qa_2', label: 'Salary Structures', route: '/payroll/salary-structures', iconName: 'Layers', permission: PERMISSIONS.SALARY_STRUCTURES_VIEW },
    { id: 'qa_3', label: 'Salary Rules', route: '/payroll/salary-rules', iconName: 'Sliders', permission: PERMISSIONS.SALARY_RULES_VIEW },
    { id: 'qa_4', label: 'Payroll Reports', route: '/reports/payroll', iconName: 'BarChart3', permission: PERMISSIONS.REPORTS_VIEW },
  ],
  [ROLES.ADMIN]: [
    { id: 'qa_1', label: 'Add Employee', route: '/employees/new', iconName: 'UserPlus', permission: PERMISSIONS.EMPLOYEES_CREATE },
    { id: 'qa_2', label: 'Manage Users', route: '/admin/users', iconName: 'UserCheck', permission: PERMISSIONS.USERS_VIEW },
    { id: 'qa_3', label: 'Create Payrun', route: '/payroll/payruns/new', iconName: 'Plus', permission: PERMISSIONS.PAYRUNS_CREATE },
    { id: 'qa_4', label: 'System Settings', route: '/admin/settings', iconName: 'Settings', permission: PERMISSIONS.SETTINGS_VIEW },
  ],
};

export const getRawDashboardTimeOffRequests = () => rawDashboardTimeOffRequests;
export const setRawDashboardTimeOffRequests = (requests) => {
  rawDashboardTimeOffRequests = requests;
};
