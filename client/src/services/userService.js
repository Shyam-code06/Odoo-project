import { apiClient } from './apiClient';

export const userService = {
  getUsers: async () => {
    try {
      const res = await apiClient.get('/users');
      return {
        success: true,
        data: res?.data || [],
      };
    } catch (err) {
      console.error('[userService] getUsers failed:', err.message);
      return {
        success: false,
        error: err.message,
        data: [],
      };
    }
  },

  getRoles: async () => {
    try {
      const res = await apiClient.get('/users/roles');
      return {
        success: true,
        data: res?.data || [],
      };
    } catch (err) {
      console.error('[userService] getRoles failed:', err.message);
      return {
        success: false,
        error: err.message,
        data: [],
      };
    }
  },

  createUser: async ({ email, password, role_id, employee_id }) => {
    try {
      const res = await apiClient.post('/users', {
        email,
        password,
        role_id,
        employee_id: employee_id || null,
      });
      return {
        success: true,
        data: res?.data,
        message: res?.message || 'User created successfully.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to create user.',
      };
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await apiClient.put(`/users/${id}`, data);
      return {
        success: true,
        data: res?.data,
        message: res?.message || 'User updated successfully.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to update user.',
      };
    }
  },

  deleteUser: async (id) => {
    try {
      const res = await apiClient.delete(`/users/${id}`);
      return {
        success: true,
        message: res?.message || 'User deleted successfully.',
      };
    } catch (err) {
      return {
        success: false,
        error: err.message || 'Failed to delete user.',
      };
    }
  },
};

export default userService;
