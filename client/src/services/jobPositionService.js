import { employeeService } from './employeeService';
import { jobPositionAdapter } from '../adapters/jobPositionAdapter';

export const jobPositionService = {
  getJobPositions: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();

        let list = rawPositions.map((p) =>
          jobPositionAdapter.toUIModel(p, rawDepts, rawEmployees)
        );

        // Search filter (title, code, department name)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.code.toLowerCase().includes(q) ||
              (p.department && p.department.name.toLowerCase().includes(q))
          );
        }

        // Department filter
        const deptFilter = params.departmentId || params.department_id;
        if (deptFilter) {
          list = list.filter((p) => p.departmentId === deptFilter);
        }

        // Status filter
        if (params.status) {
          list = list.filter(
            (p) => p.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        // Sorting
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

        // Pagination
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const apiData = jobPositionAdapter.toAPIModel(formData);

        // Validation: Title
        if (!apiData.title) {
          reject(new Error('Job position title is required.'));
          return;
        }

        // Validation: Department
        if (!apiData.department_id) {
          reject(new Error('Selecting a department is required.'));
          return;
        }

        // Validation: Unique Code
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawPositions = employeeService._getRawJobPositions();
        const idx = rawPositions.findIndex((p) => p.id === id);
        if (idx === -1) {
          reject(new Error('Job position not found.'));
          return;
        }

        const apiData = jobPositionAdapter.toAPIModel(formData);

        // Validation: Title
        if (!apiData.title) {
          reject(new Error('Job position title is required.'));
          return;
        }

        // Validation: Department
        if (!apiData.department_id) {
          reject(new Error('Selecting a department is required.'));
          return;
        }

        // Code uniqueness check (excluding self)
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
    return new Promise((resolve) => {
      setTimeout(() => {
        let rawPositions = employeeService._getRawJobPositions();
        if (departmentId) {
          rawPositions = rawPositions.filter((p) => p.department_id === departmentId);
        }
        resolve(
          rawPositions.map((p) => ({
            id: p.id,
            title: p.title,
            code: p.code,
            department_id: p.department_id,
          }))
        );
      }, 100);
    });
  },
};
