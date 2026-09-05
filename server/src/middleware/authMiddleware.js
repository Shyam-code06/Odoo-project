import { verifyAccessToken } from '../utils/tokens.js';
import UserModel from '../models/UserModel.js';
import { COOKIE_NAMES } from '../utils/cookieHelper.js';

/**
 * Authentication Middleware
 * Validates JWT Access Token from Authorization header or HTTP-only cookies
 * Attaches authenticated user to req.user
 */
export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    // 2. Check cookies fallback
    if (!token && req.cookies && req.cookies[COOKIE_NAMES.ACCESS_TOKEN]) {
      token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHENTICATED',
        message: 'Authentication token is required. Please login or provide a Bearer token.'
      });
    }

    // 3. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh your session.'
        });
      }
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_TOKEN',
        message: 'Invalid access token.'
      });
    }

    // 4. Check user existence and active status
    const user = await UserModel.findProfileById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'User associated with this token no longer exists.'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        code: 'USER_INACTIVE',
        message: 'Your account is deactivated. Please contact an administrator.'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error during authentication.'
    });
  }
};

export default authenticate;
