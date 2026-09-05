import { ROLES } from './permissions';

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
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.EMPLOYEE],
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
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
      },
      {
        id: 'departments',
        label: 'Departments',
        path: '/departments',
        iconName: 'Building2',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER],
      },
      {
        id: 'job-positions',
        label: 'Job Positions',
        path: '/job-positions',
        iconName: 'Briefcase',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER],
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
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER],
      },
      {
        id: 'schedules',
        label: 'Working Schedules',
        path: '/schedules',
        iconName: 'CalendarClock',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER],
      },
      {
        id: 'attendance',
        label: 'Attendance',
        path: '/attendance',
        iconName: 'Clock',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.EMPLOYEE],
      },
      {
        id: 'time-off',
        label: 'Time Off',
        path: '/time-off/requests',
        iconName: 'Palmtree',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.EMPLOYEE],
      },
    ],
  },
  {
    id: 'payroll',
    label: 'Payroll',
    items: [
      {
        id: 'payroll-overview',
        label: 'Payroll',
        path: '/payroll',
        iconName: 'CircleDollarSign',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
      },
      {
        id: 'payruns',
        label: 'Payruns',
        path: '/payroll/payruns',
        iconName: 'Receipt',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER],
      },
      {
        id: 'payslips',
        label: 'Payslips',
        path: '/payroll/payslips',
        iconName: 'FileSpreadsheet',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER, ROLES.HR_PAYROLL_USER, ROLES.EMPLOYEE],
      },
      {
        id: 'salary-structures',
        label: 'Salary Structures',
        path: '/payroll/salary-structures',
        iconName: 'Layers',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER],
      },
      {
        id: 'salary-rules',
        label: 'Salary Rules',
        path: '/payroll/salary-rules',
        iconName: 'Sliders',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER],
      },
      {
        id: 'salary-rule-categories',
        label: 'Rule Categories',
        path: '/payroll/salary-rule-categories',
        iconName: 'FolderKanban',
        allowedRoles: [ROLES.ADMIN, ROLES.HR_PAYROLL_MANAGER],
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
        allowedRoles: [ROLES.ADMIN, ROLES.HR_MANAGER, ROLES.HR_PAYROLL_MANAGER],
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
        allowedRoles: [ROLES.ADMIN],
      },
      {
        id: 'admin-roles',
        label: 'Roles',
        path: '/admin/roles',
        iconName: 'ShieldCheck',
        allowedRoles: [ROLES.ADMIN],
      },
      {
        id: 'admin-settings',
        label: 'Settings',
        path: '/admin/settings',
        iconName: 'Settings',
        allowedRoles: [ROLES.ADMIN],
      },
    ],
  },
];
