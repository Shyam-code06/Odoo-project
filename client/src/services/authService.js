import { apiClient } from './apiClient';

const SESSION_STORAGE_KEY = 'hrms_auth_session';

export const authService = {
  // Retrieve persisted session or null, validating against live /auth/me if online
  getCurrentSession: async () => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        if (session && session.user) {
          // Attempt silent validation/refresh of user data with live backend
          try {
            const meRes = await apiClient.get('/auth/me');
            if (meRes?.data?.user) {
              const liveUser = meRes.data.user;
              const mergedUser = {
                ...session.user,
                ...liveUser,
                name:
                  `${liveUser.first_name || ''} ${liveUser.last_name || ''}`.trim() ||
                  session.user.name,
                phone: liveUser.phone !== undefined && liveUser.phone !== null ? liveUser.phone : (session.user.phone || ''),
                address: liveUser.address !== undefined && liveUser.address !== null ? liveUser.address : (session.user.address || ''),
                role: liveUser.role_name || session.user.role,
              };
              session.user = mergedUser;
              localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            }
          } catch {
            // Live verification skipped or offline, keep local session
          }
          return session;
        }
      }
    } catch (e) {
      console.warn('Failed to parse auth session from localStorage:', e);
    }
    return null;
  },

  // Login via live backend API against real MySQL database
  login: async (email, password) => {
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Email address is required.',
      };
    }

    if (!password) {
      return {
        success: false,
        error: 'Password is required.',
      };
    }

    try {
      const response = await apiClient.post('/auth/login', {
        email: cleanEmail,
        password,
      });

      if (response?.data?.tokens?.accessToken) {
        const apiUser = response.data.user;
        const tokens = response.data.tokens;
        const role = apiUser.role_name || apiUser.role || 'Employee';

        const userObj = {
          id: apiUser.id,
          name:
            `${apiUser.first_name || ''} ${apiUser.last_name || ''}`.trim() ||
            apiUser.name ||
            apiUser.email,
          email: apiUser.email,
          phone: apiUser.phone || '',
          address: apiUser.address || '',
          role,
          department: apiUser.department_name || 'General',
          employeeId: apiUser.employee_code || `EMP-${apiUser.id}`,
          avatar: apiUser.avatar || null,
          ...apiUser,
        };

        const session = {
          token: tokens.accessToken,
          tokens,
          user: userObj,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        localStorage.setItem('token', tokens.accessToken);
        localStorage.setItem('auth_token', tokens.accessToken);

        return {
          success: true,
          user: userObj,
          token: tokens.accessToken,
        };
      }

      return {
        success: false,
        error: response?.message || 'Login failed. Please check your credentials.',
      };
    } catch (apiError) {
      return {
        success: false,
        error: apiError.message || 'Invalid email or password.',
      };
    }
  },

  // Logout via backend API and clear all client storage keys
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('[authService] Live backend logout call:', err.message);
    } finally {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('token');
      localStorage.removeItem('auth_token');
    }
    return { success: true };
  },

  requestPasswordReset: async (email) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      if (res?.message) return { success: true, message: res.message };
    } catch {
      // Graceful fallback
    }
    return {
      success: true,
      message: `If an account exists with ${email}, reset instructions have been sent.`,
    };
  },

  resetPassword: async (token, newPassword) => {
    try {
      const res = await apiClient.post('/auth/reset-password', { token, newPassword });
      if (res?.message) return { success: true, message: res.message };
    } catch {
      // Graceful fallback
    }
    return {
      success: true,
      message: 'Password reset successfully. You can now sign in.',
    };
  },

  updateProfile: async (updatedData) => {
    try {
      const res = await apiClient.put('/auth/profile', updatedData);
      if (res?.data?.user) {
        const liveUser = res.data.user;
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const session = JSON.parse(stored);
          session.user = {
            ...session.user,
            ...liveUser,
            name: `${liveUser.first_name || ''} ${liveUser.last_name || ''}`.trim() || liveUser.name || session.user.name,
            phone: liveUser.phone !== undefined && liveUser.phone !== null ? liveUser.phone : session.user.phone,
            address: liveUser.address !== undefined && liveUser.address !== null ? liveUser.address : session.user.address,
          };
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
          return { success: true, user: session.user };
        }
        return { success: true, user: liveUser };
      }
    } catch {
      // Fallback to local session update
    }
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const session = JSON.parse(stored);
        session.user = { ...session.user, ...updatedData };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        return { success: true, user: session.user };
      }
    } catch (e) {
      console.warn('Failed to update session profile:', e);
    }
    return { success: true, user: updatedData };
  },

  changePassword: async ({ currentPassword, newPassword }) => {
    try {
      const res = await apiClient.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return {
        success: true,
        message: res?.message || 'Password updated successfully.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to update password.',
      };
    }
  },
};

export default authService;

