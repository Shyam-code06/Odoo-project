// HRMS User Roles
export const ROLES = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  HR_PAYROLL_MANAGER: 'HR Payroll Manager',
  HR_PAYROLL_USER: 'HR Payroll User',
  EMPLOYEE: 'Employee',
};

// Available roles list for role switcher
export const ALL_ROLES = [
  ROLES.ADMIN,
  ROLES.HR_MANAGER,
  ROLES.HR_PAYROLL_MANAGER,
  ROLES.HR_PAYROLL_USER,
  ROLES.EMPLOYEE,
];

// Granular Permission Constants
export const PERMISSIONS = {
  DASHBOARD_VIEW: 'dashboard.view',
  PROFILE_VIEW: 'profile.view',

  // Self-Service Employee Permissions
  MY_ATTENDANCE_VIEW: 'my_attendance.view',
  MY_TIME_OFF_VIEW: 'my_time_off.view',
  MY_PAYSLIPS_VIEW: 'my_payslips.view',

  // Employees Management
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_EDIT: 'employees.edit',
  EMPLOYEES_DELETE: 'employees.delete',

  // Departments
  DEPARTMENTS_VIEW: 'departments.view',
  DEPARTMENTS_CREATE: 'departments.create',
  DEPARTMENTS_EDIT: 'departments.edit',
  DEPARTMENTS_DELETE: 'departments.delete',

  // Job Positions
  JOB_POSITIONS_VIEW: 'job_positions.view',
  JOB_POSITIONS_CREATE: 'job_positions.create',
  JOB_POSITIONS_EDIT: 'job_positions.edit',
  JOB_POSITIONS_DELETE: 'job_positions.delete',

  // Contracts
  CONTRACTS_VIEW: 'contracts.view',
  CONTRACTS_CREATE: 'contracts.create',
  CONTRACTS_EDIT: 'contracts.edit',
  CONTRACTS_DELETE: 'contracts.delete',

  // Working Schedules
  SCHEDULES_VIEW: 'schedules.view',
  SCHEDULES_CREATE: 'schedules.create',
  SCHEDULES_EDIT: 'schedules.edit',
  SCHEDULES_DELETE: 'schedules.delete',

  // Attendance Management
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_CREATE: 'attendance.create',
  ATTENDANCE_EDIT: 'attendance.edit',

  // Time Off Management
  TIME_OFF_VIEW: 'time_off.view',
  TIME_OFF_CREATE: 'time_off.create',
  TIME_OFF_EDIT: 'time_off.edit',
  TIME_OFF_APPROVE: 'time_off.approve',

  // Payruns
  PAYRUNS_VIEW: 'payruns.view',
  PAYRUNS_CREATE: 'payruns.create',
  PAYRUNS_COMPUTE: 'payruns.compute',
  PAYRUNS_VALIDATE: 'payruns.validate',
  PAYRUNS_MARK_PAID: 'payruns.mark_paid',

  // Payslips
  PAYSLIPS_VIEW: 'payslips.view',
  PAYSLIPS_CREATE: 'payslips.create',
  PAYSLIPS_SEND: 'payslips.send',

  // Salary Structures
  SALARY_STRUCTURES_VIEW: 'salary_structures.view',
  SALARY_STRUCTURES_CREATE: 'salary_structures.create',
  SALARY_STRUCTURES_EDIT: 'salary_structures.edit',
  SALARY_STRUCTURES_DELETE: 'salary_structures.delete',

  // Salary Rules
  SALARY_RULES_VIEW: 'salary_rules.view',
  SALARY_RULES_CREATE: 'salary_rules.create',
  SALARY_RULES_EDIT: 'salary_rules.edit',
  SALARY_RULES_DELETE: 'salary_rules.delete',

  // Salary Rule Categories
  SALARY_RULE_CATEGORIES_VIEW: 'salary_rule_categories.view',
  SALARY_RULE_CATEGORIES_CREATE: 'salary_rule_categories.create',
  SALARY_RULE_CATEGORIES_EDIT: 'salary_rule_categories.edit',
  SALARY_RULE_CATEGORIES_DELETE: 'salary_rule_categories.delete',

  // Reports
  REPORTS_VIEW: 'reports.view',

  // Administration
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  ROLES_VIEW: 'roles.view',
  ROLES_EDIT: 'roles.edit',

  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',
};

// Role to Permissions Mapping Definition
export const ROLE_PERMISSIONS = {
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.MY_ATTENDANCE_VIEW,
    PERMISSIONS.MY_TIME_OFF_VIEW,
    PERMISSIONS.MY_PAYSLIPS_VIEW,
    PERMISSIONS.TIME_OFF_CREATE,
  ],
  [ROLES.HR_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.MY_ATTENDANCE_VIEW,
    PERMISSIONS.MY_TIME_OFF_VIEW,
    PERMISSIONS.MY_PAYSLIPS_VIEW,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_EDIT,
    PERMISSIONS.EMPLOYEES_DELETE,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.DEPARTMENTS_CREATE,
    PERMISSIONS.DEPARTMENTS_EDIT,
    PERMISSIONS.DEPARTMENTS_DELETE,
    PERMISSIONS.JOB_POSITIONS_VIEW,
    PERMISSIONS.JOB_POSITIONS_CREATE,
    PERMISSIONS.JOB_POSITIONS_EDIT,
    PERMISSIONS.JOB_POSITIONS_DELETE,
    PERMISSIONS.CONTRACTS_VIEW,
    PERMISSIONS.SCHEDULES_VIEW,
    PERMISSIONS.SCHEDULES_CREATE,
    PERMISSIONS.SCHEDULES_EDIT,
    PERMISSIONS.SCHEDULES_DELETE,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_EDIT,
    PERMISSIONS.TIME_OFF_VIEW,
    PERMISSIONS.TIME_OFF_CREATE,
    PERMISSIONS.TIME_OFF_EDIT,
    PERMISSIONS.TIME_OFF_APPROVE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.HR_PAYROLL_USER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.MY_ATTENDANCE_VIEW,
    PERMISSIONS.MY_TIME_OFF_VIEW,
    PERMISSIONS.MY_PAYSLIPS_VIEW,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.JOB_POSITIONS_VIEW,
    PERMISSIONS.CONTRACTS_VIEW,
    PERMISSIONS.SCHEDULES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.TIME_OFF_VIEW,
    PERMISSIONS.PAYRUNS_VIEW,
    PERMISSIONS.PAYSLIPS_VIEW,
    PERMISSIONS.PAYSLIPS_CREATE,
    PERMISSIONS.PAYSLIPS_SEND,
    PERMISSIONS.SALARY_STRUCTURES_VIEW,
    PERMISSIONS.SALARY_RULES_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.HR_PAYROLL_MANAGER]: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.MY_ATTENDANCE_VIEW,
    PERMISSIONS.MY_TIME_OFF_VIEW,
    PERMISSIONS.MY_PAYSLIPS_VIEW,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.DEPARTMENTS_VIEW,
    PERMISSIONS.JOB_POSITIONS_VIEW,
    PERMISSIONS.CONTRACTS_VIEW,
    PERMISSIONS.CONTRACTS_CREATE,
    PERMISSIONS.CONTRACTS_EDIT,
    PERMISSIONS.SCHEDULES_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.TIME_OFF_VIEW,
    PERMISSIONS.PAYRUNS_VIEW,
    PERMISSIONS.PAYRUNS_CREATE,
    PERMISSIONS.PAYRUNS_COMPUTE,
    PERMISSIONS.PAYRUNS_VALIDATE,
    PERMISSIONS.PAYRUNS_MARK_PAID,
    PERMISSIONS.PAYSLIPS_VIEW,
    PERMISSIONS.PAYSLIPS_CREATE,
    PERMISSIONS.PAYSLIPS_SEND,
    PERMISSIONS.SALARY_STRUCTURES_VIEW,
    PERMISSIONS.SALARY_STRUCTURES_CREATE,
    PERMISSIONS.SALARY_STRUCTURES_EDIT,
    PERMISSIONS.SALARY_STRUCTURES_DELETE,
    PERMISSIONS.SALARY_RULES_VIEW,
    PERMISSIONS.SALARY_RULES_CREATE,
    PERMISSIONS.SALARY_RULES_EDIT,
    PERMISSIONS.SALARY_RULES_DELETE,
    PERMISSIONS.SALARY_RULE_CATEGORIES_VIEW,
    PERMISSIONS.SALARY_RULE_CATEGORIES_CREATE,
    PERMISSIONS.SALARY_RULE_CATEGORIES_EDIT,
    PERMISSIONS.SALARY_RULE_CATEGORIES_DELETE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  [ROLES.ADMIN]: Object.values(PERMISSIONS),
};

// Normalize role strings (e.g. 'ADMIN', 'admin', 'HR_MANAGER', 'hr manager') to canonical ROLES
export const normalizeRole = (role) => {
  if (!role) return ROLES.EMPLOYEE;
  const trimmed = String(role).trim();
  const upper = trimmed.toUpperCase().replace(/[\s_-]+/g, '_');

  switch (upper) {
    case 'ADMIN':
    case 'ADMINISTRATOR':
      return ROLES.ADMIN;
    case 'HR_MANAGER':
    case 'HRMANAGER':
      return ROLES.HR_MANAGER;
    case 'HR_PAYROLL_MANAGER':
    case 'HRPAYROLLMANAGER':
      return ROLES.HR_PAYROLL_MANAGER;
    case 'HR_PAYROLL_USER':
    case 'HRPAYROLLUSER':
      return ROLES.HR_PAYROLL_USER;
    case 'EMPLOYEE':
    case 'USER':
    case 'STAFF':
      return ROLES.EMPLOYEE;
    default:
      for (const val of Object.values(ROLES)) {
        if (val.toLowerCase() === trimmed.toLowerCase()) return val;
      }
      return ROLES.EMPLOYEE;
  }
};

// Check if a given role has a specific permission
export const hasPermission = (userRole, permission) => {
  if (!userRole) return false;
  const canonical = normalizeRole(userRole);
  if (canonical === ROLES.ADMIN) return true;
  const userPerms = ROLE_PERMISSIONS[canonical] || [];
  return userPerms.includes(permission);
};

// Check if a given role has ANY of the permissions in array
export const hasAnyPermission = (userRole, permissionsArray = []) => {
  if (!userRole) return false;
  const canonical = normalizeRole(userRole);
  if (canonical === ROLES.ADMIN) return true;
  if (permissionsArray.length === 0) return true;
  return permissionsArray.some((perm) => hasPermission(canonical, perm));
};

// Legacy role permission check backwards compatibility helper
export const hasRolePermission = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  const canonical = normalizeRole(userRole);
  if (canonical === ROLES.ADMIN) return true;
  const normalizedAllowed = allowedRoles.map((r) => normalizeRole(r));
  return normalizedAllowed.includes(canonical);
};
