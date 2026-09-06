import axios from 'axios';

/**
 * Centralized API HTTP Client using Axios
 * Handles baseURL, request interceptors (Bearer auth token, credentials),
 * response parsing, and error normalization.
 */

// Base API URL configuration with environment variable support
const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api';

export const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '');

// Create customized Axios instance
export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Send HTTP-only cookies (accessToken, refreshToken)
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Helper to retrieve stored token from various potential keys
 */
export const getStoredToken = () => {
  try {
    const directToken =
      localStorage.getItem('token') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('accessToken');
    if (directToken) return directToken;

    const sessionRaw = localStorage.getItem('hrms_auth_session');
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session?.token) return session.token;
      if (session?.tokens?.accessToken) return session.tokens.accessToken;
    }
  } catch {
    // Ignore storage parsing errors
  }
  return null;
};

// Request interceptor to dynamically inject Authorization Bearer token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getStoredRefreshToken = () => {
  try {
    const direct = localStorage.getItem('refreshToken');
    if (direct) return direct;
    const sessionRaw = localStorage.getItem('hrms_auth_session');
    if (sessionRaw) {
      const session = JSON.parse(sessionRaw);
      if (session?.tokens?.refreshToken) return session.tokens.refreshToken;
      if (session?.refreshToken) return session.refreshToken;
    }
  } catch {
    // Ignore storage parsing errors
  }
  return null;
};

// State for concurrent token refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to normalize responses and handle errors (including silent token refresh)
axiosInstance.interceptors.response.use(
  (response) => {
    const resData = response.data;
    // Standardize return structure while retaining backward compatibility
    return {
      success: true,
      data: resData?.data !== undefined ? resData.data : resData,
      message: resData?.message || 'Success',
      pagination: resData?.pagination,
      status: response.status,
      raw: resData,
    };
  },
  async (error) => {
    const originalRequest = error.config;
    let errorMsg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected network error occurred';

    if (Array.isArray(error.response?.data?.errors) && error.response.data.errors.length > 0) {
      const details = error.response.data.errors
        .map((e) => (typeof e === 'string' ? e : e.message || (e.field ? `${e.field}: invalid` : '')))
        .filter(Boolean)
        .join(', ');
      if (details) {
        errorMsg = errorMsg && errorMsg !== 'Validation failed' ? `${errorMsg}: ${details}` : details;
      }
    }

    const normalizedError = new Error(errorMsg);
    normalizedError.status = status;
    normalizedError.data = error.response?.data;
    normalizedError.isAxiosError = true;

    // Handle token expiration & automatic refresh
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getStoredRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(normalizedError);
      }

      return new Promise((resolve, reject) => {
        axios
          .post(
            `${API_BASE_URL}/auth/refresh`,
            { refreshToken },
            { withCredentials: true }
          )
          .then((res) => {
            const newAccessToken =
              res.data?.data?.tokens?.accessToken ||
              res.data?.tokens?.accessToken;
            const newRefreshToken =
              res.data?.data?.tokens?.refreshToken ||
              res.data?.tokens?.refreshToken;

            if (newAccessToken) {
              localStorage.setItem('token', newAccessToken);
              localStorage.setItem('accessToken', newAccessToken);
              localStorage.setItem('auth_token', newAccessToken);

              const sessionRaw = localStorage.getItem('hrms_auth_session');
              if (sessionRaw) {
                try {
                  const session = JSON.parse(sessionRaw);
                  session.token = newAccessToken;
                  if (session.tokens) {
                    session.tokens.accessToken = newAccessToken;
                    if (newRefreshToken) session.tokens.refreshToken = newRefreshToken;
                  }
                  localStorage.setItem('hrms_auth_session', JSON.stringify(session));
                } catch {
                  // Ignore parse error
                }
              }

              axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
              processQueue(null, newAccessToken);
              resolve(axiosInstance(originalRequest));
            } else {
              processQueue(new Error('Failed to refresh authentication token'), null);
              reject(normalizedError);
            }
          })
          .catch((refreshErr) => {
            processQueue(refreshErr, null);
            reject(normalizedError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(normalizedError);
  }
);

/**
 * High-level API Client wrapper matching project service signatures
 */
export const apiClient = {
  axiosInstance,

  get: async (endpoint, params = {}, config = {}) => {
    return axiosInstance.get(endpoint, {
      params,
      ...config,
    });
  },

  post: async (endpoint, data = {}, config = {}) => {
    return axiosInstance.post(endpoint, data, config);
  },

  put: async (endpoint, data = {}, config = {}) => {
    return axiosInstance.put(endpoint, data, config);
  },

  patch: async (endpoint, data = {}, config = {}) => {
    return axiosInstance.patch(endpoint, data, config);
  },

  delete: async (endpoint, config = {}) => {
    return axiosInstance.delete(endpoint, config);
  },

  request: async (config) => {
    return axiosInstance.request(config);
  },
};

export default apiClient;
