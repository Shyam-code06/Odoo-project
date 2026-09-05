import { employeeService } from './employeeService';
import { departmentAdapter } from '../adapters/departmentAdapter';
import { apiClient } from './apiClient';

export const departmentService = {
  getDepartments: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.get('/departments', params);
      if (apiRes?.success && apiRes?.data) {
        const rawList = Array.isArray(apiRes.data) ? apiRes.data : apiRes.data.departments || [];
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();
        const uiList = rawList.map((d) =>
          departmentAdapter.toUIModel(d, rawEmployees, rawPositions)
        );

        return {
          data: uiList,
          total: apiRes.pagination?.total || uiList.length,
          page: apiRes.pagination?.page || params.page || 1,
          pageSize: apiRes.pagination?.limit || params.pageSize || 10,
          totalPages:
            apiRes.pagination?.totalPages ||
            Math.ceil(uiList.length / (params.pageSize || 10)) ||
            1,
        };
      }
    } catch (err) {
      console.warn('[departmentService] Live getDepartments failed, falling back to local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();

        let list = rawDepts.map((d) =>
          departmentAdapter.toUIModel(d, rawEmployees, rawPositions)
        );

        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              d.code.toLowerCase().includes(q) ||
              (d.manager && d.manager.name.toLowerCase().includes(q))
          );
        }

        const managerFilter = params.managerId || params.manager_id;
        if (managerFilter) {
          list = list.filter((d) => d.managerId === managerFilter);
        }

        if (params.status) {
          list = list.filter(
            (d) => d.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          list.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (key === 'manager') {
              valA = a.manager ? a.manager.name : '';
              valB = b.manager ? b.manager.name : '';
            }

            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }

        const total = list.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const paginated = list.slice(startIndex, startIndex + pageSize);

        resolve({
          data: paginated,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        });
      }, 200);
    });
  },

  getDepartmentById: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.get(`/departments/${id}`);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();
        return departmentAdapter.toUIModel(apiRes.data, rawEmployees, rawPositions);
      }
    } catch (err) {
      console.warn(`[departmentService] Live getDepartmentById(${id}) failed, falling back:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();

        const dept = rawDepts.find((d) => d.id === id);
        if (!dept) {
          resolve(null);
          return;
        }

        resolve(departmentAdapter.toUIModel(dept, rawEmployees, rawPositions));
      }, 150);
    });
  },

  createDepartment: async (formData) => {
    const apiData = departmentAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.post('/departments', apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();
        return {
          success: true,
          department: departmentAdapter.toUIModel(apiRes.data, rawEmployees, rawPositions),
        };
      }
    } catch (err) {
      console.warn('[departmentService] Live createDepartment failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();

        const codeExists = rawDepts.some(
          (d) => d.code.toUpperCase() === apiData.code.toUpperCase()
        );
        if (codeExists) {
          reject(new Error(`Department code "${apiData.code}" is already in use.`));
          return;
        }

        if (!apiData.name) {
          reject(new Error('Department name is required.'));
          return;
        }

        const newDept = {
          id: `dept-${String(rawDepts.length + 1).padStart(3, '0')}`,
          name: apiData.name,
          code: apiData.code,
          description: apiData.description,
          manager_id: apiData.manager_id,
          status: apiData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updatedDepts = [newDept, ...rawDepts];
        employeeService._setRawDepartments(updatedDepts);

        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();

        resolve({
          success: true,
          department: departmentAdapter.toUIModel(newDept, rawEmployees, rawPositions),
        });
      }, 250);
    });
  },

  updateDepartment: async (id, formData) => {
    const apiData = departmentAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.put(`/departments/${id}`, apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();
        return {
          success: true,
          department: departmentAdapter.toUIModel(apiRes.data, rawEmployees, rawPositions),
        };
      }
    } catch (err) {
      console.warn(`[departmentService] Live updateDepartment(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const idx = rawDepts.findIndex((d) => d.id === id);
        if (idx === -1) {
          reject(new Error('Department not found.'));
          return;
        }

        const codeExists = rawDepts.some(
          (d) => d.id !== id && d.code.toUpperCase() === apiData.code.toUpperCase()
        );
        if (codeExists) {
          reject(new Error(`Department code "${apiData.code}" is already in use.`));
          return;
        }

        const updated = {
          ...rawDepts[idx],
          name: apiData.name || rawDepts[idx].name,
          code: apiData.code || rawDepts[idx].code,
          description: apiData.description,
          manager_id: apiData.manager_id,
          status: apiData.status,
          updated_at: new Date().toISOString(),
        };

        rawDepts[idx] = updated;
        employeeService._setRawDepartments([...rawDepts]);

        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();

        resolve({
          success: true,
          department: departmentAdapter.toUIModel(updated, rawEmployees, rawPositions),
        });
      }, 250);
    });
  },

  deleteDepartment: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.delete(`/departments/${id}`);
      if (apiRes?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn(`[departmentService] Live deleteDepartment(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const filtered = rawDepts.filter((d) => d.id !== id);
        employeeService._setRawDepartments(filtered);
        resolve({ success: true });
      }, 200);
    });
  },

  getDepartmentOptions: async () => {
    try {
      const apiRes = await apiClient.get('/departments', { limit: 100 });
      if (apiRes?.success && apiRes?.data) {
        const list = Array.isArray(apiRes.data) ? apiRes.data : apiRes.data.departments || [];
        return list.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          status: d.status,
        }));
      }
    } catch {
      // Fallback
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        resolve(
          rawDepts.map((d) => ({
            id: d.id,
            name: d.name,
            code: d.code,
            status: d.status,
          }))
        );
      }, 100);
    });
  },
};

export default departmentService;
