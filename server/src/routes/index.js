import { Router } from 'express';
import authRoutes from './authRoutes.js';
import rbacTestRoutes from './rbacTestRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import jobPositionRoutes from './jobPositionRoutes.js';
import timeOffTypeRoutes from './timeOffTypeRoutes.js';
import salaryRuleCategoryRoutes from './salaryRuleCategoryRoutes.js';
import employeeRoutes from './employeeRoutes.js';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);

// RBAC testing routes
router.use('/rbac-test', rbacTestRoutes);

// Phase 3: Master Data Management routes
router.use('/departments', departmentRoutes);
router.use('/job-positions', jobPositionRoutes);
router.use('/time-off/types', timeOffTypeRoutes);
router.use('/salary-rule-categories', salaryRuleCategoryRoutes);

// Phase 4: Employee Management routes
router.use('/employees', employeeRoutes);

export default router;

