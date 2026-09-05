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

// Helper to check if a user role is authorized for a list of allowed roles
export const hasRolePermission = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!userRole) return false;
  return allowedRoles.includes(userRole) || userRole === ROLES.ADMIN;
};
