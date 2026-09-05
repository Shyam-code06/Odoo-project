import { employeeService } from './employeeService';
import { jobPositionAdapter } from '../adapters/jobPositionAdapter';
import { apiClient } from './apiClient';

export const jobPositionService = {
  getJobPositions: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiParams = {
        page: params.page || 1,
        limit: params.pageSize || params.limit || 20,
        search: params.search || undefined,
        department_id: params.departmentId || params.department_id || undefined,
        sortBy: params.sortBy || undefined,
        sortOrder: params.sortDirection || params.sortOrder || undefined,
      };
      const apiRes = await apiClient.get('/job-positions', apiParams);
      if (apiRes?.success && apiRes?.data) {
        const rawPositions = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.jobPositions || [];
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();

        const uiList = rawPositions.map((p) =>
          jobPositionAdapter.toUIModel(p, rawDepts, rawEmployees)
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
      console.warn('[jobPositionService] Live getJobPositions failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();

        let list = rawPositions.map((p) =>
          jobPositionAdapter.toUIModel(p, rawDepts, rawEmployees)
        );

        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.code.toLowerCase().includes(q) ||
              (p.department && p.department.name.toLowerCase().includes(q))
          );
        }

        const deptFilter = params.departmentId || params.department_id;
        if (deptFilter) {
          list = list.filter((p) => p.departmentId === deptFilter);
        }

        if (params.status) {
          list = list.filter(
            (p) => p.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          list.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (key === 'department') {
              valA = a.department ? a.department.name : '';
              valB = b.department ? b.department.name : '';
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

  getJobPositionById: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.get(`/job-positions/${id}`);
      if (apiRes?.success && apiRes?.data) {
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();
        return jobPositionAdapter.toUIModel(apiRes.data, rawDepts, rawEmployees);
      }
    } catch (err) {
      console.warn(`[jobPositionService] Live getJobPositionById(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();

        const pos = rawPositions.find((p) => p.id === id);
        if (!pos) {
          resolve(null);
          return;
        }

        resolve(jobPositionAdapter.toUIModel(pos, rawDepts, rawEmployees));
      }, 150);
    });
  },

  createJobPosition: async (formData) => {
    const apiData = jobPositionAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.post('/job-positions', apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();
        return {
          success: true,
          jobPosition: jobPositionAdapter.toUIModel(apiRes.data, rawDepts, rawEmployees),
        };
      }
    } catch (err) {
      console.warn('[jobPositionService] Live createJobPosition failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();

        if (!apiData.title) {
          reject(new Error('Job position title is required.'));
          return;
        }

        if (!apiData.department_id) {
          reject(new Error('Selecting a department is required.'));
          return;
        }

        const codeExists = rawPositions.some(
          (p) => p.code.toUpperCase() === apiData.code.toUpperCase()
        );
        if (codeExists) {
          reject(new Error(`Job position code "${apiData.code}" is already in use.`));
          return;
        }

        const newPos = {
          id: `pos-${String(rawPositions.length + 1).padStart(3, '0')}`,
          title: apiData.title,
          code: apiData.code,
          department_id: apiData.department_id,
          description: apiData.description,
          status: apiData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updatedPositions = [newPos, ...rawPositions];
        employeeService._setRawJobPositions(updatedPositions);

        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();

        resolve({
          success: true,
          jobPosition: jobPositionAdapter.toUIModel(newPos, rawDepts, rawEmployees),
        });
      }, 250);
    });
  },

  updateJobPosition: async (id, formData) => {
    const apiData = jobPositionAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.put(`/job-positions/${id}`, apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();
        return {
          success: true,
          jobPosition: jobPositionAdapter.toUIModel(apiRes.data, rawDepts, rawEmployees),
        };
      }
    } catch (err) {
      console.warn(`[jobPositionService] Live updateJobPosition(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const idx = rawPositions.findIndex((p) => p.id === id);
        if (idx === -1) {
          reject(new Error('Job position not found.'));
          return;
        }

        if (!apiData.title) {
          reject(new Error('Job position title is required.'));
          return;
        }

        if (!apiData.department_id) {
          reject(new Error('Selecting a department is required.'));
          return;
        }

        const codeExists = rawPositions.some(
          (p) => p.id !== id && p.code.toUpperCase() === apiData.code.toUpperCase()
        );
        if (codeExists) {
          reject(new Error(`Job position code "${apiData.code}" is already in use.`));
          return;
        }

        const updated = {
          ...rawPositions[idx],
          title: apiData.title,
          code: apiData.code,
          department_id: apiData.department_id,
          description: apiData.description,
          status: apiData.status,
          updated_at: new Date().toISOString(),
        };

        rawPositions[idx] = updated;
        employeeService._setRawJobPositions([...rawPositions]);

        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();

        resolve({
          success: true,
          jobPosition: jobPositionAdapter.toUIModel(updated, rawDepts, rawEmployees),
        });
      }, 250);
    });
  },

  deleteJobPosition: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.delete(`/job-positions/${id}`);
      if (apiRes?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn(`[jobPositionService] Live deleteJobPosition(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const filtered = rawPositions.filter((p) => p.id !== id);
        employeeService._setRawJobPositions(filtered);
        resolve({ success: true });
      }, 200);
    });
  },

  getJobPositionOptions: async (departmentId = null) => {
    try {
      const cleanDeptId = departmentId ? Number(departmentId) : null;
      const params = {
        limit: 100,
        ...(cleanDeptId ? { department_id: cleanDeptId } : {})
      };
      const apiRes = await apiClient.get('/job-positions', params);
      const list = Array.isArray(apiRes?.data)
        ? apiRes.data
        : (Array.isArray(apiRes?.data?.data) ? apiRes.data.data : []);
      if (list && list.length > 0) {
        const filtered = cleanDeptId
          ? list.filter((p) => Number(p.department_id) === cleanDeptId)
          : list;
        return filtered.map((p) => ({
          id: p.id,
          title: p.title || p.name,
          code: p.code,
          department_id: p.department_id,
        }));
      }
    } catch (err) {
      console.warn('[jobPositionService] Live getJobPositionOptions failed:', err.message);
    }

    let rawPositions = employeeService._getRawJobPositions();
    if (departmentId) {
      rawPositions = rawPositions.filter((p) => String(p.department_id) === String(departmentId));
    }
    return rawPositions.map((p) => ({
      id: p.id,
      title: p.title || p.name,
      code: p.code,
      department_id: p.department_id,
    }));
  },
};

export default jobPositionService;
