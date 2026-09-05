import { Router } from 'express';
import authRoutes from './authRoutes.js';
import rbacTestRoutes from './rbacTestRoutes.js';

const router = Router();

// Mount authentication routes
router.use('/auth', authRoutes);

// Mount RBAC testing routes
router.use('/rbac-test', rbacTestRoutes);

export default router;
