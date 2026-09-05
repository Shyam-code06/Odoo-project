import { Router } from 'express';
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee
} from '../controllers/employeeController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';
import {
  validateEmployeeCreate,
  validateEmployeeUpdate,
  validateEmployeeStatus
} from '../validators/employeeValidator.js';

const router = Router();

// All employee endpoints require authentication
router.use(authenticate);

// Read endpoints: accessible by all authenticated roles (Employee, HR Manager, HR Payroll User, HR Payroll Manager, Admin)
router.get('/', getEmployees);
router.get('/:id', getEmployeeById);

// Write endpoints: restricted to HR Manager, HR Payroll Manager, Admin
router.post(
  '/',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateEmployeeCreate,
  createEmployee
);

// Custom authorizer allowing self-service profile update or management roles
const authorizeSelfOrRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication is required.' });
    }

    const currentRole = (req.user.role_name || '').trim().toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.trim().toLowerCase());

    if (currentRole === 'admin' || normalizedAllowed.includes(currentRole)) {
      return next();
    }

    // Permit employee to update their own linked employee record
    if (req.user.employee_id && String(req.user.employee_id) === String(req.params.id)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Forbidden: You do not have permission to perform this action.'
    });
  };
};

router.put(
  '/:id',
  authorizeSelfOrRoles('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateEmployeeUpdate,
  updateEmployee
);

router.patch(
  '/:id/status',
  authorize('Admin', 'HR Manager', 'HR Payroll Manager'),
  validateEmployeeStatus,
  updateEmployeeStatus
);

// Delete endpoint: restricted to Admin and HR Manager
router.delete(
  '/:id',
  authorize('Admin', 'HR Manager'),
  deleteEmployee
);

export default router;
