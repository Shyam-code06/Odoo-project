import { Router } from 'express';
import { signup, login, refresh, logout, getMe } from '../controllers/authController.js';
import { validateSignup, validateLogin } from '../middleware/validateAuth.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = Router();

/**
 * @route   POST /auth/signup
 * @desc    Register new user
 * @access  Public
 */
router.post('/signup', validateSignup, signup);

/**
 * @route   POST /auth/login
 * @desc    Log in existing user
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post('/refresh', refresh);
router.post('/refresh-token', refresh);

/**
 * @route   POST /auth/logout
 * @desc    Log out and revoke refresh token
 * @access  Public (or protected if token supplied)
 */
router.post('/logout', logout);

/**
 * @route   GET /auth/me
 * @desc    Get currently authenticated user details
 * @access  Protected
 */
router.get('/me', authenticate, getMe);

export default router;
