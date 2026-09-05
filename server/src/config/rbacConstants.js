/**
 * Predefined System Roles (Constants)
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  HR_PAYROLL_MANAGER: 'HR_PAYROLL_MANAGER',
  HR_PAYROLL_USER: 'HR_PAYROLL_USER',
  HR_MANAGER: 'HR_MANAGER',
  EMPLOYEE: 'EMPLOYEE'
};

export const ROLES_DATA = [
  {
    code: ROLES.ADMIN,
    name: 'Admin',
    description: 'System Administrator with full access across all platform modules, users, and configurations.'
  },
  {
    code: ROLES.HR_PAYROLL_MANAGER,
    name: 'HR Payroll Manager',
    description: 'Full CRUD access to HR, Employees, Contracts, Attendance, Time Off, Payruns, Payslips, Salary Structures, and Salary Rules.'
  },
  {
    code: ROLES.HR_PAYROLL_USER,
    name: 'HR Payroll User',
    description: 'HR Manager capabilities plus Create/Read/Update access to Payruns and Payslips, with read-only access to Salary Structures/Rules.'
  },
  {
    code: ROLES.HR_MANAGER,
    name: 'HR Manager',
    description: 'Full CRUD access to Employees, Attendance, Contracts, Working Schedules, and Time Off modules. No payroll access.'
  },
  {
    code: ROLES.EMPLOYEE,
    name: 'Employee',
    description: 'Standard employee portal access: view own profile, attendance, leave requests/balances, and payslips.'
  }
];

/**
 * In-Memory Role to Permissions Mapping
 */
export const ROLE_PERMISSIONS = {
  ADMIN: [
    // Superuser wildcard / full suite
    'employee.read', 'employee.read.own', 'employee.create', 'employee.update', 'employee.delete',
    'contract.read', 'contract.read.own', 'contract.create', 'contract.update', 'contract.delete',
    'schedule.read', 'schedule.create', 'schedule.update', 'schedule.delete',
    'attendance.read', 'attendance.read.own', 'attendance.create.own', 'attendance.correct', 'attendance.delete',
    'timeoff.read', 'timeoff.read.own', 'timeoff.request.own', 'timeoff.approve', 'timeoff.allocate',
    'payrun.read', 'payrun.create', 'payrun.compute', 'payrun.validate', 'payrun.mark_paid', 'payrun.send', 'payrun.delete',
    'payslip.read', 'payslip.read.own', 'payslip.generate', 'payslip.send',
    'salary_structure.read', 'salary_structure.manage',
    'salary_rule.read', 'salary_rule.manage',
    'reports.read', 'reports.read.hr',
    'users.manage', 'roles.manage', 'permissions.manage'
  ],

  HR_PAYROLL_MANAGER: [
    'employee.read', 'employee.read.own', 'employee.create', 'employee.update', 'employee.delete',
    'contract.read', 'contract.read.own', 'contract.create', 'contract.update', 'contract.delete',
    'schedule.read', 'schedule.create', 'schedule.update', 'schedule.delete',
    'attendance.read', 'attendance.read.own', 'attendance.create.own',
    'timeoff.read', 'timeoff.read.own', 'timeoff.request.own', 'timeoff.approve', 'timeoff.allocate',
    'payrun.read', 'payrun.create', 'payrun.compute', 'payrun.validate', 'payrun.mark_paid', 'payrun.send', 'payrun.delete',
    'payslip.read', 'payslip.read.own', 'payslip.generate', 'payslip.send',
    'salary_structure.read', 'salary_structure.manage',
    'salary_rule.read', 'salary_rule.manage',
    'reports.read', 'reports.read.hr'
  ],

  HR_PAYROLL_USER: [
    'employee.read', 'employee.read.own', 'employee.create', 'employee.update', 'employee.delete',
    'contract.read', 'contract.read.own', 'contract.create', 'contract.update', 'contract.delete',
    'schedule.read', 'schedule.create', 'schedule.update', 'schedule.delete',
    'attendance.read', 'attendance.read.own', 'attendance.create.own',
    'timeoff.read', 'timeoff.read.own', 'timeoff.request.own', 'timeoff.approve', 'timeoff.allocate',
    'payrun.read', 'payrun.create', 'payrun.compute', 'payrun.validate',
    'payslip.read', 'payslip.read.own', 'payslip.generate',
    'salary_structure.read', // Read-only access
    'salary_rule.read',      // Read-only access
    'reports.read', 'reports.read.hr'
  ],

  HR_MANAGER: [
    'employee.read', 'employee.read.own', 'employee.create', 'employee.update', 'employee.delete',
    'contract.read', 'contract.read.own',
    'schedule.read', 'schedule.create', 'schedule.update', 'schedule.delete',
    'attendance.read', 'attendance.read.own', 'attendance.create.own',
    'timeoff.read', 'timeoff.read.own', 'timeoff.request.own', 'timeoff.approve', 'timeoff.allocate',
    'reports.read.hr'
  ],

  EMPLOYEE: [
    'employee.read.own',
    'contract.read.own',
    'attendance.read.own', 'attendance.create.own',
    'timeoff.read.own', 'timeoff.request.own',
    'payslip.read.own'
  ]
};

/**
 * Get permission codes for a role code or role name
 * @param {string} roleCodeOrName
 * @returns {string[]}
 */
export const getPermissionsForRole = (roleCodeOrName) => {
  if (!roleCodeOrName) return [];
  const normalized = roleCodeOrName.toUpperCase().replace(/\s+/g, '_');
  return ROLE_PERMISSIONS[normalized] || [];
};

/**
 * Check if a role possesses a specific permission
 * @param {string} roleCodeOrName
 * @param {string} permissionCode
 * @returns {boolean}
 */
export const hasPermission = (roleCodeOrName, permissionCode) => {
  if (!roleCodeOrName || !permissionCode) return false;
  const normalized = roleCodeOrName.toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'ADMIN') return true;
  const permissions = ROLE_PERMISSIONS[normalized] || [];
  return permissions.includes(permissionCode);
};

export default {
  ROLES,
  ROLES_DATA,
  ROLE_PERMISSIONS,
  getPermissionsForRole,
  hasPermission
};
