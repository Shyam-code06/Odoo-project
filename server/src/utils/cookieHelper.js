import { parseDurationToDate } from './tokens.js';

const isProduction = process.env.NODE_ENV === 'production';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken'
};

/**
 * Set authentication cookies on Express response
 * @param {import('express').Response} res
 * @param {string} accessToken
 * @param {string} refreshToken
 */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const accessExpiry = parseDurationToDate(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
  const refreshExpiry = parseDurationToDate(process.env.JWT_REFRESH_EXPIRES_IN || '7d');

  if (accessToken) {
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      expires: accessExpiry,
      path: '/'
    });
  }

  if (refreshToken) {
    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'strict' : 'lax',
      expires: refreshExpiry,
      path: '/'
    });
  }
};

/**
 * Clear authentication cookies
 * @param {import('express').Response} res
 */
export const clearAuthCookies = (res) => {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  });

  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/'
  });
};

export default {
  COOKIE_NAMES,
  setAuthCookies,
  clearAuthCookies
};
