import { PERMISSIONS, ROLES } from './permissions';

export const NAVIGATION_CATEGORIES = [
  {
    id: 'main',
    label: 'Main',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        iconName: 'LayoutDashboard',
        permission: PERMISSIONS.DASHBOARD_VIEW,
      },
    ],
  },
  {
    id: 'self-service',
    label: 'My Workspace',
    items: [
      {
        id: 'my-profile',
        label: 'My Profile',
        path: '/profile',
        iconName: 'User',
        permission: PERMISSIONS.PROFILE_VIEW,
      },
      {
        id: 'my-attendance',
        label: 'My Attendance',
        path: '/my-attendance',
        iconName: 'Clock',
        permission: PERMISSIONS.MY_ATTENDANCE_VIEW,
      },
      {
        id: 'my-time-off',
        label: 'My Time Off',
        path: '/my-time-off',
        iconName: 'Palmtree',
        permission: PERMISSIONS.MY_TIME_OFF_VIEW,
      },
      {
        id: 'my-payslips',
        label: 'My Payslips',
        path: '/my-payslips',
        iconName: 'FileSpreadsheet',
        permission: PERMISSIONS.MY_PAYSLIPS_VIEW,
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      {
        id: 'employees',
        label: 'Employees',
        path: '/employees',
        iconName: 'Users',
        permission: PERMISSIONS.EMPLOYEES_VIEW,
      },
      {
        id: 'departments',
        label: 'Departments',
        path: '/departments',
        iconName: 'Building2',
        permission: PERMISSIONS.DEPARTMENTS_VIEW,
      },
      {
        id: 'job-positions',
        label: 'Job Positions',
        path: '/job-positions',
        iconName: 'Briefcase',
        permission: PERMISSIONS.JOB_POSITIONS_VIEW,
      },
    ],
  },
  {
    id: 'workforce',
    label: 'Workforce',
    items: [
      {
        id: 'contracts',
        label: 'Contracts',
        path: '/contracts',
        iconName: 'FileText',
        permission: PERMISSIONS.CONTRACTS_VIEW,
      },
      {
        id: 'schedules',
        label: 'Working Schedules',
        path: '/schedules',
        iconName: 'CalendarClock',
        permission: PERMISSIONS.SCHEDULES_VIEW,
      },
      {
        id: 'attendance',
        label: 'Attendance Management',
        path: '/attendance',
        iconName: 'Clock',
        permission: PERMISSIONS.ATTENDANCE_VIEW,
      },
      {
        id: 'time-off',
        label: 'Time Off Requests',
        path: '/time-off/requests',
        iconName: 'Palmtree',
        permission: PERMISSIONS.TIME_OFF_VIEW,
      },
      {
        id: 'time-off-allocations',
        label: 'Leave Allocations',
        path: '/time-off/allocations',
        iconName: 'PieChart',
        permission: PERMISSIONS.TIME_OFF_VIEW,
      },
      {
        id: 'time-off-types',
        label: 'Time Off Types',
        path: '/time-off/types',
        iconName: 'CalendarDays',
        permission: PERMISSIONS.TIME_OFF_VIEW,
      },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    items: [
      {
        id: 'payroll-overview',
        label: 'Payroll Overview',
        path: '/payroll',
        iconName: 'CircleDollarSign',
        permission: PERMISSIONS.PAYRUNS_VIEW,
      },
      {
        id: 'payruns',
        label: 'Payruns',
        path: '/payroll/payruns',
        iconName: 'Receipt',
        permission: PERMISSIONS.PAYRUNS_VIEW,
      },
      {
        id: 'payslips',
        label: 'Payslips Directory',
        path: '/payroll/payslips',
        iconName: 'FileSpreadsheet',
        permission: PERMISSIONS.PAYSLIPS_VIEW,
      },
      {
        id: 'salary-structures',
        label: 'Salary Structures',
        path: '/payroll/salary-structures',
        iconName: 'Layers',
        permission: PERMISSIONS.SALARY_STRUCTURES_VIEW,
      },
      {
        id: 'salary-rules',
        label: 'Salary Rules',
        path: '/payroll/salary-rules',
        iconName: 'Sliders',
        permission: PERMISSIONS.SALARY_RULES_VIEW,
      },
      {
        id: 'salary-rule-categories',
        label: 'Rule Categories',
        path: '/payroll/salary-rule-categories',
        iconName: 'FolderKanban',
        permission: PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW,
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        iconName: 'BarChart3',
        permission: PERMISSIONS.REPORTS_VIEW,
      },
    ],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      {
        id: 'admin-users',
        label: 'Users',
        path: '/admin/users',
        iconName: 'UserCheck',
        permission: PERMISSIONS.USERS_VIEW,
      },
      {
        id: 'admin-roles',
        label: 'Roles',
        path: '/admin/roles',
        iconName: 'ShieldCheck',
        permission: PERMISSIONS.ROLES_VIEW,
      },
      {
        id: 'admin-settings',
        label: 'Settings',
        path: '/admin/settings',
        iconName: 'Settings',
        permission: PERMISSIONS.SETTINGS_VIEW,
      },
    ],
  },
];
