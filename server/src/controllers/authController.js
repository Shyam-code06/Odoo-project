import { UserModel, RefreshTokenModel, EmployeeModel, RoleModel } from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyRefreshToken,
  getRefreshTokenExpiry
} from '../utils/tokens.js';
import { setAuthCookies, clearAuthCookies, COOKIE_NAMES } from '../utils/cookieHelper.js';

/**
 * Extract client IP address from request
 */
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  );
};

/**
 * Sanitize user object to never leak sensitive data like password_hash
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

/**
 * POST /auth/signup
 * Register a new user account
 */
export const signup = async (req, res) => {
  try {
    const { email, password, role_id, employee_id } = req.body;

    // 1. Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'An account with this email address already exists.'
      });
    }

    // 2. Validate employee_id if provided
    if (employee_id) {
      const employee = await EmployeeModel.findById(employee_id);
      if (!employee) {
        return res.status(404).json({
          status: 'error',
          code: 'EMPLOYEE_NOT_FOUND',
          message: `Employee with ID ${employee_id} does not exist.`
        });
      }

      // Check if employee is already linked to another user account
      const userLinked = await UserModel.findOne({ employee_id });
      if (userLinked) {
        return res.status(409).json({
          status: 'error',
          code: 'EMPLOYEE_ALREADY_LINKED',
          message: `Employee ${employee_id} is already linked to a user account.`
        });
      }
    }

    // 3. Resolve role_id (default to Employee role id = 4 or fallback to 1)
    let assignedRoleId = role_id;
    if (!assignedRoleId) {
      const defaultRole = await RoleModel.findByName('Employee');
      assignedRoleId = defaultRole ? defaultRole.id : 4;
    } else {
      const roleExists = await RoleModel.findById(assignedRoleId);
      if (!roleExists) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_ROLE',
          message: `Role with ID ${assignedRoleId} does not exist.`
        });
      }
    }

    // 4. Hash password
    const password_hash = await hashPassword(password);

    // 5. Create user in database
    const newUser = await UserModel.create({
      email,
      password_hash,
      role_id: assignedRoleId,
      employee_id: employee_id || null,
      is_active: true
    });

    // 6. Fetch full user profile
    const userProfile = await UserModel.findProfileById(newUser.id);

    // 7. Generate tokens
    const accessToken = generateAccessToken(userProfile);
    const { token: refreshToken, jti } = generateRefreshToken(userProfile);

    // 8. Hash and store refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();
    const userAgent = req.headers['user-agent']?.substring(0, 255) || null;
    const ipAddress = getClientIp(req);

    await RefreshTokenModel.create({
      user_id: userProfile.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_revoked: false,
      user_agent: userAgent,
      ip_address: ipAddress
    });

    // 9. Set HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully.',
      data: {
        user: sanitizeUser(userProfile),
        tokens: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create user account.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /auth/login
 * Authenticate user and issue tokens
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email (including password_hash for check)
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    // 2. Verify password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.'
      });
    }

    // 3. Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        status: 'error',
        code: 'ACCOUNT_DEACTIVATED',
        message: 'This account has been deactivated. Please contact your system administrator.'
      });
    }

    // 4. Fetch full user profile
    const userProfile = await UserModel.findProfileById(user.id);

    // 5. Generate tokens
    const accessToken = generateAccessToken(userProfile);
    const { token: refreshToken } = generateRefreshToken(userProfile);

    // 6. Hash and store refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = getRefreshTokenExpiry();
    const userAgent = req.headers['user-agent']?.substring(0, 255) || null;
    const ipAddress = getClientIp(req);

    await RefreshTokenModel.create({
      user_id: userProfile.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_revoked: false,
      user_agent: userAgent,
      ip_address: ipAddress
    });

    // 7. Set HTTP-only cookies
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(200).json({
      status: 'success',
      message: 'Logged in successfully.',
      data: {
        user: sanitizeUser(userProfile),
        tokens: {
          accessToken,
          refreshToken,
          tokenType: 'Bearer',
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to authenticate user.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /auth/refresh
 * Refresh access token using a valid refresh token with token rotation
 */
export const refresh = async (req, res) => {
  try {
    // 1. Extract refresh token from body, cookie, or header
    let rawRefreshToken =
      req.body?.refreshToken ||
      req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ||
      req.headers['x-refresh-token'];

    if (!rawRefreshToken) {
      return res.status(400).json({
        status: 'error',
        code: 'REFRESH_TOKEN_REQUIRED',
        message: 'Refresh token is required.'
      });
    }

    // 2. Verify JWT signature & structure
    let decoded;
    try {
      decoded = verifyRefreshToken(rawRefreshToken);
    } catch (err) {
      return res.status(401).json({
        status: 'error',
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Invalid or expired refresh token.'
      });
    }

    // 3. Lookup stored refresh token record by hash
    const incomingTokenHash = hashToken(rawRefreshToken);
    const tokenRecord = await RefreshTokenModel.findByTokenHash(incomingTokenHash);

    if (!tokenRecord) {
      return res.status(401).json({
        status: 'error',
        code: 'TOKEN_NOT_FOUND',
        message: 'Refresh token is not recognized.'
      });
    }

    // 4. Token Reuse Detection: if token is already revoked, revoke all sessions for this user!
    if (tokenRecord.is_revoked) {
      await RefreshTokenModel.revokeAllUserTokens(tokenRecord.user_id);
      clearAuthCookies(res);
      return res.status(403).json({
        status: 'error',
        code: 'TOKEN_REUSE_DETECTED',
        message: 'Security warning: Refresh token reuse detected. All sessions have been terminated. Please log in again.'
      });
    }

    // 5. Check if expired in DB
    const now = new Date();
    const tokenExpiry = new Date(tokenRecord.expires_at);
    if (tokenExpiry <= now) {
      await RefreshTokenModel.revokeToken(incomingTokenHash);
      clearAuthCookies(res);
      return res.status(401).json({
        status: 'error',
        code: 'REFRESH_TOKEN_EXPIRED',
        message: 'Refresh token has expired. Please log in again.'
      });
    }

    // 6. Check user active status
    const userProfile = await UserModel.findProfileById(tokenRecord.user_id);
    if (!userProfile || !userProfile.is_active) {
      await RefreshTokenModel.revokeToken(incomingTokenHash);
      clearAuthCookies(res);
      return res.status(403).json({
        status: 'error',
        code: 'USER_INACTIVE',
        message: 'Account is inactive or no longer exists.'
      });
    }

    // 7. Token Rotation: Issue new Access Token & new Refresh Token
    const newAccessToken = generateAccessToken(userProfile);
    const { token: newRefreshToken } = generateRefreshToken(userProfile);
    const newHash = hashToken(newRefreshToken);
    const newExpiresAt = getRefreshTokenExpiry();
    const userAgent = req.headers['user-agent']?.substring(0, 255) || null;
    const ipAddress = getClientIp(req);

    // 8. Invalidate old refresh token and record replacement hash
    await RefreshTokenModel.revokeToken(incomingTokenHash, newHash);

    // 9. Save new refresh token record
    await RefreshTokenModel.create({
      user_id: userProfile.id,
      token_hash: newHash,
      expires_at: newExpiresAt,
      is_revoked: false,
      user_agent: userAgent,
      ip_address: ipAddress
    });

    // 10. Update cookies
    setAuthCookies(res, newAccessToken, newRefreshToken);

    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully.',
      data: {
        tokens: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
          tokenType: 'Bearer',
          expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m'
        }
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to refresh token.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /auth/logout
 * Invalidate refresh token and clear cookies
 */
export const logout = async (req, res) => {
  try {
    const rawRefreshToken =
      req.body?.refreshToken ||
      req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] ||
      req.headers['x-refresh-token'];

    if (rawRefreshToken) {
      const tokenHash = hashToken(rawRefreshToken);
      await RefreshTokenModel.revokeToken(tokenHash);
    }

    // If user is authenticated via access token, we can also revoke active tokens if requested
    if (req.body?.allDevices && req.user?.id) {
      await RefreshTokenModel.revokeAllUserTokens(req.user.id);
    }

    // Clear client cookies
    clearAuthCookies(res);

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to log out.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /auth/me
 * Return profile of currently authenticated user
 */
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      status: 'success',
      data: {
        user: sanitizeUser(req.user)
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch user profile.'
    });
  }
};

/**
 * PUT /auth/me or PUT /auth/profile
 * Update profile details of currently authenticated user
 */
export const updateMyProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, address, date_of_birth, password } = req.body;
    const userId = req.user.id;
    const employeeId = req.user.employee_id;

    if (employeeId) {
      const empUpdatePayload = {};
      if (first_name !== undefined) empUpdatePayload.first_name = String(first_name).trim();
      if (last_name !== undefined) empUpdatePayload.last_name = String(last_name).trim();
      if (phone !== undefined) empUpdatePayload.phone = phone ? String(phone).trim() : null;
      if (address !== undefined) empUpdatePayload.address = address ? String(address).trim() : null;
      if (date_of_birth !== undefined) empUpdatePayload.date_of_birth = date_of_birth ? String(date_of_birth).trim() : null;
      empUpdatePayload.updated_at = new Date();

      await EmployeeModel.updateById(employeeId, empUpdatePayload);
    }

    const userUpdatePayload = {
      updated_at: new Date()
    };

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      userUpdatePayload.password_hash = await hashPassword(password.trim());
    }

    await UserModel.updateById(userId, userUpdatePayload);

    const freshUser = await UserModel.findProfileById(userId);

    return res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully.',
      data: {
        user: sanitizeUser(freshUser)
      }
    });
  } catch (error) {
    console.error('updateMyProfile error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update user profile.'
    });
  }
};

/**
 * POST /auth/change-password or PUT /auth/password
 * Securely change password for currently authenticated user
 */
export const changePassword = async (req, res) => {
  try {
    const { current_password, currentPassword, new_password, newPassword } = req.body;
    const oldPassword = current_password || currentPassword;
    const targetPassword = new_password || newPassword;
    const userId = req.user.id;

    if (!targetPassword || typeof targetPassword !== 'string' || targetPassword.trim().length < 6) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_PASSWORD',
        message: 'New password must be at least 6 characters long.'
      });
    }

    const userRecord = await UserModel.findById(userId);
    if (!userRecord) {
      return res.status(404).json({
        status: 'error',
        code: 'USER_NOT_FOUND',
        message: 'User account not found.'
      });
    }

    // Verify current password if provided
    if (oldPassword && userRecord.password_hash) {
      const isMatch = await comparePassword(oldPassword, userRecord.password_hash);
      if (!isMatch) {
        return res.status(400).json({
          status: 'error',
          code: 'INVALID_CURRENT_PASSWORD',
          message: 'The current password you entered is incorrect.'
        });
      }
    }

    // Hash new password using bcrypt
    const password_hash = await hashPassword(targetPassword.trim());

    // Update users table in MySQL
    await UserModel.updateById(userId, {
      password_hash,
      updated_at: new Date()
    });

    return res.status(200).json({
      status: 'success',
      message: 'Password updated successfully. Please use your new password next time you log in.'
    });
  } catch (error) {
    console.error('changePassword error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update password.'
    });
  }
};

export default {
  signup,
  login,
  refresh,
  logout,
  getMe,
  updateMyProfile,
  changePassword
};
