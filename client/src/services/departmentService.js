import { employeeService } from './employeeService';
import { departmentAdapter } from '../adapters/departmentAdapter';

export const departmentService = {
  getDepartments: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const rawEmployees = employeeService._getRawEmployees();
        const rawPositions = employeeService._getRawJobPositions();

        // Convert to UI Models
        let list = rawDepts.map((d) =>
          departmentAdapter.toUIModel(d, rawEmployees, rawPositions)
        );

        // Search filter (Department name, code, manager name)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              d.code.toLowerCase().includes(q) ||
              (d.manager && d.manager.name.toLowerCase().includes(q))
          );
        }

        // Manager filter
        const managerFilter = params.managerId || params.manager_id;
        if (managerFilter) {
          list = list.filter((d) => d.managerId === managerFilter);
        }

        // Status filter
        if (params.status) {
          list = list.filter(
            (d) => d.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        // Sorting
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

  getDepartmentById: async (id) => {
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const apiData = departmentAdapter.toAPIModel(formData);

        // Validation: Unique Code
        const codeExists = rawDepts.some(
          (d) => d.code.toUpperCase() === apiData.code.toUpperCase()
        );
        if (codeExists) {
          reject(new Error(`Department code "${apiData.code}" is already in use.`));
          return;
        }

        // Validation: Name
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawDepts = employeeService._getRawDepartments();
        const idx = rawDepts.findIndex((d) => d.id === id);
        if (idx === -1) {
          reject(new Error('Department not found.'));
          return;
        }

        const apiData = departmentAdapter.toAPIModel(formData);

        // Code uniqueness check (excluding self)
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
