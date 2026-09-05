import { ROLES, PERMISSIONS } from '../config/permissions';

export const MOCK_STATS_BY_ROLE = {
  [ROLES.EMPLOYEE]: [
    {
      id: 'stat_emp_1',
      title: 'Today Check-In',
      value: '09:42 AM',
      description: 'Worked 4h 18m today',
      iconName: 'Clock',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_emp_2',
      title: 'Leave Balance',
      value: '14 Days',
      description: '12 Paid Annual • 2 Sick',
      iconName: 'Palmtree',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_emp_3',
      title: 'Pending Requests',
      value: '1 Request',
      description: 'Vacation Oct 12 - Oct 15',
      iconName: 'CalendarDays',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_emp_4',
      title: 'Latest Payslip',
      value: '₹48,500',
      description: 'September 2026 Issued',
      iconName: 'FileSpreadsheet',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.HR_MANAGER]: [
    {
      id: 'stat_hrm_1',
      title: 'Total Employees',
      value: '1,248',
      trend: '+4.2%',
      trendDirection: 'up',
      description: 'Total workforce headcount',
      iconName: 'Users',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_hrm_2',
      title: 'Active Employees',
      value: '1,186',
      trend: '95.0%',
      trendDirection: 'up',
      description: 'Currently operational',
      iconName: 'UserCheck',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_hrm_3',
      title: 'Employees On Leave',
      value: '42',
      trend: '+8 this week',
      trendDirection: 'neutral',
      description: 'Approved time off',
      iconName: 'Palmtree',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_hrm_4',
      title: 'Pending Time Off',
      value: '17 Requests',
      trend: 'Requires review',
      trendDirection: 'down',
      description: 'Awaiting HR approval',
      iconName: 'CalendarDays',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.HR_PAYROLL_USER]: [
    {
      id: 'stat_pru_1',
      title: 'Total Payroll Employees',
      value: '1,186',
      description: 'Included in active cycle',
      iconName: 'Users',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_pru_2',
      title: 'Processed Payslips',
      value: '1,120',
      trend: '94.4%',
      trendDirection: 'up',
      description: 'Payslips generated',
      iconName: 'Receipt',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_pru_3',
      title: 'Pending Processing',
      value: '66 Records',
      description: 'Verification needed',
      iconName: 'Clock',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_pru_4',
      title: 'Monthly Net Payroll',
      value: '₹1.82 Cr',
      description: 'September 2026 cycle',
      iconName: 'CircleDollarSign',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.HR_PAYROLL_MANAGER]: [
    {
      id: 'stat_prm_1',
      title: 'Gross Monthly Payroll',
      value: '₹1,82,40,000',
      trend: '+2.1% from Aug',
      trendDirection: 'up',
      description: 'Total salary disbursement',
      iconName: 'CircleDollarSign',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_prm_2',
      title: 'Salary Structures',
      value: '12 Active',
      description: 'Pay grade frameworks',
      iconName: 'Layers',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_prm_3',
      title: 'Salary Rules',
      value: '48 Rules',
      description: 'Allowances & deductions',
      iconName: 'Sliders',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_prm_4',
      title: 'Payrun Status',
      value: 'In Progress',
      description: 'Ready for final lock',
      iconName: 'CheckCircle2',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
  [ROLES.ADMIN]: [
    {
      id: 'stat_adm_1',
      title: 'Total Employees',
      value: '1,248',
      trend: '+12 this month',
      trendDirection: 'up',
      description: 'All departments',
      iconName: 'Users',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
    },
    {
      id: 'stat_adm_2',
      title: 'System Users',
      value: '42 Accounts',
      description: 'Active portal users',
      iconName: 'UserCheck',
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'stat_adm_3',
      title: 'Departments',
      value: '16 Active',
      description: 'Organizational units',
      iconName: 'Building2',
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'stat_adm_4',
      title: 'Monthly Payroll',
      value: '₹1.82 Cr',
      description: 'September disbursement',
      iconName: 'CircleDollarSign',
      color: 'bg-rose-50 text-rose-600 border-rose-200',
    },
  ],
};

export const MOCK_ATTENDANCE_SUMMARY = {
  present: 842,
  late: 31,
  absent: 12,
  onLeave: 42,
  wfh: 86,
  totalExpected: 1013,
  weeklyTrend: [
    { day: 'Mon', present: 860, absent: 10, late: 25 },
    { day: 'Tue', present: 875, absent: 8, late: 20 },
    { day: 'Wed', present: 850, absent: 15, late: 30 },
    { day: 'Thu', present: 842, absent: 12, late: 31 },
    { day: 'Fri', present: 830, absent: 18, late: 35 },
  ],
};

let rawDashboardTimeOffRequests = [
  {
    id: 'tor_1',
    employeeName: 'Ananya Sharma',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    leaveType: 'Annual Leave',
    dates: '12 Sep - 15 Sep',
    days: 4,
    status: 'Pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'tor_2',
    employeeName: 'Vikram Malhotra',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    leaveType: 'Sick Leave',
    dates: '08 Sep - 09 Sep',
    days: 2,
    status: 'Pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'tor_3',
    employeeName: 'Rohan Gupta',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    leaveType: 'Work From Home',
    dates: '11 Sep',
    days: 1,
    status: 'Approved',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
  },
  {
    id: 'tor_4',
    employeeName: 'Meera Sen',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    leaveType: 'Casual Leave',
    dates: '18 Sep',
    days: 1,
    status: 'Pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
  },
];

export const MOCK_UPCOMING_EVENTS = [
  {
    id: 'evt_1',
    title: 'Anjali Patel Birthday',
    category: 'Birthday',
    date: 'Sep 08',
    iconName: 'Cake',
    color: 'text-pink-600 bg-pink-50',
  },
  {
    id: 'evt_2',
    title: 'Rajesh Kumar 3-Yr Anniversary',
    category: 'Work Anniversary',
    date: 'Sep 10',
    iconName: 'Award',
    color: 'text-amber-600 bg-amber-50',
  },
  {
    id: 'evt_3',
    title: 'Ganesh Chaturthi Holiday',
    category: 'Public Holiday',
    date: 'Sep 14',
    iconName: 'Calendar',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    id: 'evt_4',
    title: 'September Payroll Lock',
    category: 'Payroll Deadline',
    date: 'Sep 25',
    iconName: 'Receipt',
    color: 'text-rose-600 bg-rose-50',
  },
];

export const MOCK_RECENT_ACTIVITIES = [
  {
    id: 'act_1',
    actorName: 'Priya Mehta',
    action: 'approved time-off request for',
    target: 'Rohan Gupta (Work From Home)',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    iconName: 'CheckCircle2',
  },
  {
    id: 'act_2',
    actorName: 'System',
    action: 'onboarded new employee profile',
    target: 'Eleanor Vance (Senior Frontend Engineer)',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    iconName: 'UserPlus',
  },
  {
    id: 'act_3',
    actorName: 'Neha Shah',
    action: 'updated salary computation rules for',
    target: 'HRA & Special Allowance #AY-2026',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    iconName: 'Sliders',
  },
  {
    id: 'act_4',
    actorName: 'Arjun Patel',
    action: 'verified payslip batch for',
    target: 'Engineering Department (142 Employees)',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    iconName: 'FileSpreadsheet',
  },
];

export const MOCK_PAYROLL_SUMMARY = {
  period: 'September 2026',
  totalEmployees: 1186,
  grossPayroll: 18240000,
  processedCount: 1120,
  pendingCount: 66,
  status: 'In Progress',
  payrunId: 'PAY-2026-09',
};

export const MOCK_NEEDS_ATTENTION_BY_ROLE = {
  [ROLES.EMPLOYEE]: [
    { id: 'att_1', label: '1 Pending Time-Off Request', route: '/my-time-off', type: 'warning' },
    { id: 'att_2', label: 'September Payslip Available', route: '/my-payslips', type: 'info' },
  ],
  [ROLES.HR_MANAGER]: [
    { id: 'att_1', label: '17 Time-off requests awaiting review', route: '/time-off/requests', type: 'warning' },
    { id: 'att_2', label: '12 Employees missing check-in today', route: '/attendance', type: 'error' },
    { id: 'att_3', label: '3 Employment contracts expiring in 14 days', route: '/contracts', type: 'info' },
  ],
  [ROLES.HR_PAYROLL_USER]: [
    { id: 'att_1', label: '66 Employee payslips require verification', route: '/payroll/payruns', type: 'warning' },
  ],
  [ROLES.HR_PAYROLL_MANAGER]: [
    { id: 'att_1', label: 'September Payrun ready for authorization', route: '/payroll/payruns', type: 'warning' },
    { id: 'att_2', label: '2 Salary structure exceptions flagged', route: '/payroll/salary-structures', type: 'error' },
  ],
  [ROLES.ADMIN]: [
    { id: 'att_1', label: '17 Pending HR time-off approvals', route: '/time-off/requests', type: 'warning' },
    { id: 'att_2', label: 'September Payrun ready for authorization', route: '/payroll/payruns', type: 'info' },
    { id: 'att_3', label: 'System audit log review required', route: '/admin/settings', type: 'info' },
  ],
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
