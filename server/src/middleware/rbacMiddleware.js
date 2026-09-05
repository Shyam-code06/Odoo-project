import { authenticate } from './authMiddleware.js';

/**
 * Re-export authenticate as requireAuth for standard naming
 */
export const requireAuth = authenticate;

/**
 * Role-Based Access Control Middleware
 * Checks if the authenticated user has one of the allowed roles.
 * ADMIN role automatically passes all role checks.
 *
 * @param {...string|string[]} roles - Allowed role codes (e.g. 'ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE')
 */
export const requireRole = (...roles) => {
  const flattenedRoles = roles.flat().map((r) => r.toUpperCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please provide a valid access token.'
      });
    }

    const userRoleCode = (req.user.role_code || req.user.role_name || '').toUpperCase().replace(/\s+/g, '_');

    // Admin has superuser access
    if (userRoleCode === 'ADMIN') {
      return next();
    }

    // Check if user's role is in allowed list
    const hasRole = flattenedRoles.some((role) => {
      const normalized = role.toUpperCase().replace(/\s+/g, '_');
      return userRoleCode === normalized;
    });

    if (!hasRole) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. Requires one of the following roles: [${flattenedRoles.join(', ')}]. Current role: ${req.user.role_code || req.user.role_name}.`
      });
    }

    next();
  };
};

/**
 * Permission-Based Access Control Middleware
 * Checks if the authenticated user possesses the specific permission(s).
 * ADMIN role automatically passes all permission checks.
 *
 * @param {string|string[]} permissions - Required permission code(s) (e.g. 'payrun.create', 'employee.read')
 * @param {object} [options={ mode: 'any' }] - 'any' = user needs at least one; 'all' = user needs all
 */
export const requirePermission = (permissions, options = { mode: 'any' }) => {
  const permList = Array.isArray(permissions) ? permissions : [permissions];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please provide a valid access token.'
      });
    }

    const userRoleCode = (req.user.role_code || req.user.role_name || '').toUpperCase().replace(/\s+/g, '_');

    // Admin has unrestricted access across all permissions
    if (userRoleCode === 'ADMIN') {
      return next();
    }

    const userPermissions = new Set(req.user.permissions || []);

    const hasPermission =
      options.mode === 'all'
        ? permList.every((p) => userPermissions.has(p))
        : permList.some((p) => userPermissions.has(p));

    if (!hasPermission) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. You lack the required permission: [${permList.join(', ')}].`
      });
    }

    next();
  };
};

/**
 * Resource Ownership Middleware
 * Enforces that standard EMPLOYEES can only access their own resources (profile, attendance, timeoff, payslips).
 * Higher roles with general management permissions bypass this check.
 *
 * @param {object} config
 * @param {string} [config.paramName='id'] - Request parameter containing the employeeId
 * @param {string} [config.generalPermission] - General management permission (e.g. 'employee.read')
 * @param {string} [config.ownPermission] - Own resource permission (e.g. 'employee.read.own')
 * @param {string[]} [config.exemptRoles=['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']]
 */
export const requireOwnership = (config = {}) => {
  const {
    paramName = 'id',
    generalPermission,
    ownPermission,
    exemptRoles = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER']
  } = config;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.'
      });
    }

    const userRoleCode = (req.user.role_code || req.user.role_name || '').toUpperCase().replace(/\s+/g, '_');

    // 1. Check if user's role is exempt (Managers/Admins)
    if (exemptRoles.map((r) => r.toUpperCase()).includes(userRoleCode)) {
      return next();
    }

    // 2. Check if user has general permission
    if (generalPermission && req.user.permissions?.includes(generalPermission)) {
      return next();
    }

    // 3. Resolve target employee ID
    const targetEmployeeId =
      req.params[paramName] ||
      req.query.employee_id ||
      req.query.employeeId ||
      req.body.employee_id ||
      req.body.employeeId;

    if (!targetEmployeeId) {
      return res.status(400).json({
        status: 'error',
        code: 'BAD_REQUEST',
        message: `Unable to verify ownership: Target employee identifier '${paramName}' missing in request.`
      });
    }

    // 4. Verify ownership against user's linked employee_id
    if (!req.user.employee_id || String(req.user.employee_id) !== String(targetEmployeeId)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN_OWNERSHIP',
        message: 'Access denied. You can only view or manage your own records.'
      });
    }

    // 5. If ownPermission is specified, ensure user has it
    if (ownPermission && !req.user.permissions?.includes(ownPermission)) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: `Access denied. You lack the required permission: ${ownPermission}.`
      });
    }

    next();
  };
};

export default {
  requireAuth,
  requireRole,
  requirePermission,
  requireOwnership
};
