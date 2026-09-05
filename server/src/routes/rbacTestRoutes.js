import { Router } from 'express';
import { requireAuth, requireRole, requirePermission, requireOwnership } from '../middleware/rbacMiddleware.js';

const router = Router();

// 1. Employee profile route with Ownership check
router.get(
  '/employees/:id',
  requireAuth,
  requireOwnership({
    paramName: 'id',
    generalPermission: 'employee.read',
    ownPermission: 'employee.read.own'
  }),
  (req, res) => {
    res.json({
      status: 'success',
      message: `Accessed employee record ${req.params.id}`,
      accessedBy: req.user.email,
      role: req.user.role_code
    });
  }
);

// 2. Payrun creation route (HR Payroll User, HR Payroll Manager, Admin)
router.post(
  '/payruns',
  requireAuth,
  requirePermission('payrun.create'),
  (req, res) => {
    res.json({
      status: 'success',
      message: 'Payrun created successfully',
      accessedBy: req.user.email,
      role: req.user.role_code
    });
  }
);

// 3. Salary structure management (HR Payroll Manager, Admin only)
router.post(
  '/salary-structures',
  requireAuth,
  requirePermission('salary_structure.manage'),
  (req, res) => {
    res.json({
      status: 'success',
      message: 'Salary structure updated successfully',
      accessedBy: req.user.email,
      role: req.user.role_code
    });
  }
);

// 4. HR reports (HR Manager, HR Payroll User, HR Payroll Manager, Admin)
router.get(
  '/reports/hr',
  requireAuth,
  requirePermission('reports.read.hr'),
  (req, res) => {
    res.json({
      status: 'success',
      message: 'HR reports data retrieved',
      accessedBy: req.user.email,
      role: req.user.role_code
    });
  }
);

// 5. Admin-only system management
router.get(
  '/admin/system-config',
  requireAuth,
  requireRole('ADMIN'),
  (req, res) => {
    res.json({
      status: 'success',
      message: 'Admin system config accessed',
      accessedBy: req.user.email,
      role: req.user.role_code
    });
  }
);

export default router;
