import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'odoo_default_jwt_access_secret_key_change_in_production';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'odoo_default_jwt_refresh_secret_key_change_in_production';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Hash a raw token string with SHA-256 for secure database storage & lookup
 * @param {string} token
 * @returns {string}
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate a JWT Access Token
 * @param {object} user - User record or payload
 * @returns {string}
 */
export const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    roleId: user.role_id,
    employeeId: user.employee_id || null
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN
  });
};

/**
 * Generate a JWT Refresh Token with a unique jti
 * @param {object} user - User record
 * @returns {{ token: string, jti: string }}
 */
export const generateRefreshToken = (user) => {
  const jti = crypto.randomUUID();
  const payload = {
    userId: user.id,
    jti
  };

  const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });

  return { token, jti };
};

/**
 * Verify Access Token
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, JWT_ACCESS_SECRET);
};

/**
 * Verify Refresh Token
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT_REFRESH_SECRET);
};

/**
 * Convert duration string (e.g. '15m', '7d', '24h', '3600s') to expiration Date object
 * @param {string} durationStr
 * @returns {Date}
 */
export const parseDurationToDate = (durationStr) => {
  const now = Date.now();
  if (typeof durationStr === 'number') {
    return new Date(now + durationStr * 1000);
  }

  const match = durationStr.match(/^(\d+)([smhdwy])$/);
  if (!match) {
    // Default 7 days if invalid format
    return new Date(now + 7 * 24 * 60 * 60 * 1000);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    y: 365 * 24 * 60 * 60 * 1000
  };

  return new Date(now + value * (multipliers[unit] || 86400000));
};

/**
 * Get refresh token expiration Date
 * @returns {Date}
 */
export const getRefreshTokenExpiry = () => {
  return parseDurationToDate(JWT_REFRESH_EXPIRES_IN);
};

export default {
  hashToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  parseDurationToDate,
  getRefreshTokenExpiry
};
