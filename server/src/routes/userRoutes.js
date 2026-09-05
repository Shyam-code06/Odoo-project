import { Router } from 'express';
import {
  getUsers,
  getRoles,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all user management endpoints with authentication & admin role
router.use(authenticate);
router.use(authorize('Admin'));

router.get('/', getUsers);
router.get('/roles', getRoles);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
