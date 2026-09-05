import { MOCK_CURRENT_USER } from '../mocks/authData';

export const authService = {
  getCurrentUser: async () => {
    // Simulate minor network latency for realistic frontend service abstraction
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...MOCK_CURRENT_USER });
      }, 50);
    });
  },

  login: async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          user: {
            ...MOCK_CURRENT_USER,
            email: email || MOCK_CURRENT_USER.email,
          },
        });
      }, 200);
    });
  },

  logout: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  },
};
