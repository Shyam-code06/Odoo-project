import { Router } from 'express';
import authRoutes from './authRoutes.js';
import rbacTestRoutes from './rbacTestRoutes.js';
import departmentRoutes from './departmentRoutes.js';
import jobPositionRoutes from './jobPositionRoutes.js';
import timeOffTypeRoutes from './timeOffTypeRoutes.js';
import salaryRuleCategoryRoutes from './salaryRuleCategoryRoutes.js';
import employeeRoutes from './employeeRoutes.js';
import scheduleRoutes from './scheduleRoutes.js';
import contractRoutes from './contractRoutes.js';
import attendanceRoutes from './attendanceRoutes.js';
import timeOffRoutes from './timeOffRoutes.js';

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

// Phase 5: Working Schedules & Contracts routes
router.use('/schedules', scheduleRoutes);
router.use('/contracts', contractRoutes);

// Phase 6: Attendance routes
router.use('/attendance', attendanceRoutes);

// Phase 7: Time Off / Leave Management routes
router.use('/time-off', timeOffRoutes);

export default router;
