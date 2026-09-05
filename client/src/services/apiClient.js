/**
 * Centralized API HTTP Client
 * Production-ready HTTP abstraction using native Fetch API.
 * Handles baseURL, request interceptors (Bearer auth token), response parsing,
 * HTTP error status handling, and seamless API / Mock data bridging.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Toggle to control whether failed API calls automatically fallback to local mock store
const ENABLE_MOCK_FALLBACK = true;

/**
 * Core Request Wrapper
 */
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    method: options.method || 'GET',
    headers,
    ...options,
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  try {
    const response = await fetch(url, config);

    // Handle 401 Unauthorized token expiry
    if (response.status === 401) {
      console.warn('[API Client] Unauthorized request (401). Token may be expired.');
    }

    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = (data && data.message) || `HTTP Error ${response.status}: ${response.statusText}`;
      throw new Error(errorMsg);
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message || 'Success',
      status: response.status,
    };
  } catch (error) {
    console.warn(`[API Client] Call to '${endpoint}' failed:`, error.message);
    if (ENABLE_MOCK_FALLBACK) {
      // Re-throw error so individual services can handle fallback or error state gracefully
      throw error;
    }
    return {
      success: false,
      message: error.message || 'Network request failed',
      error,
    };
  }
}

export const apiClient = {
  get: (endpoint, params = {}, options = {}) => {
    let queryString = '';
    if (params && Object.keys(params).length > 0) {
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      if (Object.keys(filteredParams).length > 0) {
        queryString = `?${new URLSearchParams(filteredParams).toString()}`;
      }
    }
    return request(`${endpoint}${queryString}`, { ...options, method: 'GET' });
  },

  post: (endpoint, body = {}, options = {}) => {
    return request(endpoint, { ...options, method: 'POST', body });
  },

  put: (endpoint, body = {}, options = {}) => {
    return request(endpoint, { ...options, method: 'PUT', body });
  },

  patch: (endpoint, body = {}, options = {}) => {
    return request(endpoint, { ...options, method: 'PATCH', body });
  },

  delete: (endpoint, options = {}) => {
    return request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default apiClient;
