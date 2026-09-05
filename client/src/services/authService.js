import { MOCK_USERS, DEFAULT_DEMO_PASSWORD } from '../mocks/authData';

const SESSION_STORAGE_KEY = 'hrms_auth_session';

export const authService = {
  // Retrieve persisted session or null
  getCurrentSession: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const stored = localStorage.getItem(SESSION_STORAGE_KEY);
          if (stored) {
            const session = JSON.parse(stored);
            if (session && session.user) {
              resolve(session);
              return;
            }
          }
        } catch (e) {
          console.warn('Failed to parse auth session from localStorage:', e);
        }
        // Default to null if no stored session exists
        resolve(null);
      }, 100);
    });
  },

  login: async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const cleanEmail = email ? email.trim().toLowerCase() : '';

        // Match against mock users array
        const userObj = Object.values(MOCK_USERS).find(
          (u) => u.email.toLowerCase() === cleanEmail
        );

        if (!userObj) {
          resolve({
            success: false,
            error: 'Invalid credentials. Please check your email address.',
          });
          return;
        }

        // Demo password check (allow any password >= 6 chars for testing flexibility, or default password)
        if (password && password.length < 6) {
          resolve({
            success: false,
            error: 'Password must be at least 6 characters.',
          });
          return;
        }

        const session = {
          token: `mock_jwt_token_${Date.now()}`,
          user: userObj,
          loginTime: new Date().toISOString(),
        };

        try {
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
        } catch (e) {
          console.warn('Failed to save auth session to localStorage:', e);
        }

        resolve({
          success: true,
          user: userObj,
          token: session.token,
        });
      }, 250);
    });
  },

  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        } catch (e) {
          console.warn('Failed to clear auth session:', e);
        }
        resolve({ success: true });
      }, 100);
    });
  },

  requestPasswordReset: async (email) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `If an account exists with ${email}, reset instructions have been sent.`,
        });
      }, 200);
    });
  },

  resetPassword: async (token, newPassword) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Password reset successfully. You can now sign in.',
        });
      }, 250);
    });
  },

  updateProfile: async (updatedData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          const stored = localStorage.getItem(SESSION_STORAGE_KEY);
          if (stored) {
            const session = JSON.parse(stored);
            session.user = { ...session.user, ...updatedData };
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
            resolve({ success: true, user: session.user });
            return;
          }
        } catch (e) {
          console.warn('Failed to update session profile:', e);
        }
        resolve({ success: true, user: updatedData });
      }, 150);
    });
  },
};
