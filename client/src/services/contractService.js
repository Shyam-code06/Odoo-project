import { apiClient } from './apiClient';

export const contractService = {
  getContracts: async (params = {}) => {
    try {
      const query = {
        page: params.page || 1,
        limit: params.pageSize || params.limit || 10,
        ...(params.search ? { search: params.search } : {}),
        ...(params.status ? { status: params.status.toLowerCase() } : {}),
        ...(params.departmentId || params.department_id
          ? { department_id: params.departmentId || params.department_id }
          : {}),
        ...(params.employeeId || params.employee_id
          ? { employee_id: params.employeeId || params.employee_id }
          : {}),
        ...(params.sortBy ? { sortBy: params.sortBy } : {}),
        ...(params.sortOrder || params.sortDirection
          ? { sortOrder: (params.sortOrder || params.sortDirection).toLowerCase() }
          : {}),
      };

      const res = await apiClient.get('/contracts', query);
      if (res?.success) {
        return {
          data: res.data || [],
          total: res.pagination?.total || (res.data || []).length,
          page: res.pagination?.page || query.page,
          pageSize: res.pagination?.limit || query.limit,
          totalPages: res.pagination?.totalPages || 1,
        };
      }
    } catch (err) {
      console.warn('[contractService] getContracts error:', err.message);
      throw err;
    }

    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    };
  },

  getContractById: async (id) => {
    const res = await apiClient.get(`/contracts/${id}`);
    return res?.data || null;
  },

  createContract: async (payload) => {
    return apiClient.post('/contracts', payload);
  },

  updateContract: async (id, payload) => {
    return apiClient.put(`/contracts/${id}`, payload);
  },

  updateContractStatus: async (id, status) => {
    return apiClient.patch(`/contracts/${id}/status`, { status });
  },
};

export default contractService;
