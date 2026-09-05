import {
  getRawDepartments,
  setRawDepartments,
  getRawJobPositions,
  setRawJobPositions,
  getRawSchedules,
  setRawSchedules,
  getRawEmployees,
  setRawEmployees,
  getRawAttendance,
  setRawAttendance,
  getRawTimeOffTypes,
  setRawTimeOffTypes,
  getRawTimeOffAllocations,
  setRawTimeOffAllocations,
  getRawTimeOffRequests,
  setRawTimeOffRequests,
  getRawSalaryStructures,
  setRawSalaryStructures,
  getRawSalaryRuleCategories,
  setRawSalaryRuleCategories,
  getRawSalaryRules,
  setRawSalaryRules,
  getRawContracts,
  setRawContracts,
  getRawPayruns,
  setRawPayruns,
  getRawPayrunEmployees,
  setRawPayrunEmployees,
  getRawPayslips,
  setRawPayslips,
  getRawPayslipLines,
  setRawPayslipLines,
} from '../mocks';
import { apiClient } from './apiClient';

// Helper to populate reference entity names
const populateEmployee = (emp) => {
  if (!emp) return null;
  const dept = getRawDepartments().find((d) => d.id === (emp.department_id || emp.departmentId));
  const pos = getRawJobPositions().find((p) => p.id === (emp.job_position_id || emp.jobPositionId));
  const mgr = getRawEmployees().find((m) => m.id === (emp.manager_id || emp.managerId));
  const sched = getRawSchedules().find((s) => s.id === (emp.working_schedule_id || emp.workingScheduleId));

  return {
    ...emp,
    fullName:
      emp.fullName ||
      `${emp.first_name || ''} ${emp.last_name || ''}`.trim() ||
      emp.name ||
      'Employee',
    departmentName: emp.department_name || (dept ? dept.name : 'Unassigned'),
    jobPositionTitle: emp.job_position_title || (pos ? pos.title : 'Unassigned'),
    managerName:
      emp.manager_name ||
      (mgr ? `${mgr.first_name} ${mgr.last_name}` : 'None (Top Level)'),
    workingScheduleName:
      emp.working_schedule_name || (sched ? sched.name : 'Standard Shift'),
    relatedCounts: emp.relatedCounts || {
      contracts: emp.summary?.contracts_count ?? 0,
      attendance: emp.summary?.attendance_count ?? 0,
      timeOff: emp.summary?.time_off_requests_count ?? 0,
      allocations: 0,
    },
  };
};

export const employeeService = {
  getEmployees: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.get('/employees', params);
      if (apiRes?.success && apiRes?.data) {
        const rawList = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.employees || [];
        const formatted = rawList.map(populateEmployee);

        return {
          data: formatted,
          total: apiRes.pagination?.total || formatted.length,
          page: apiRes.pagination?.page || params.page || 1,
          pageSize: apiRes.pagination?.limit || params.pageSize || 10,
          totalPages:
            apiRes.pagination?.totalPages ||
            Math.ceil(formatted.length / (params.pageSize || 10)) ||
            1,
        };
      }
    } catch (err) {
      console.warn('[employeeService] Live getEmployees failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = getRawEmployees().map(populateEmployee);

        // Search filter (Name, Code, Email)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          result = result.filter(
            (e) =>
              e.fullName.toLowerCase().includes(q) ||
              (e.employee_code && e.employee_code.toLowerCase().includes(q)) ||
              (e.email && e.email.toLowerCase().includes(q))
          );
        }

        // Filters
        if (params.department_id) {
          result = result.filter((e) => e.department_id === params.department_id);
        }
        if (params.job_position_id) {
          result = result.filter((e) => e.job_position_id === params.job_position_id);
        }
        if (params.manager_id) {
          result = result.filter((e) => e.manager_id === params.manager_id);
        }
        if (params.employment_status) {
          result = result.filter(
            (e) =>
              e.employment_status &&
              e.employment_status.toLowerCase() === params.employment_status.toLowerCase()
          );
        }
        if (params.working_schedule_id) {
          result = result.filter((e) => e.working_schedule_id === params.working_schedule_id);
        }

        // Sorting
        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          result.sort((a, b) => {
            const valA = a[key] || '';
            const valB = b[key] || '';
            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }

        // Pagination
        const total = result.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const paginated = result.slice(startIndex, startIndex + pageSize);

        resolve({
          data: paginated,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        });
      }, 250);
    });
  },

  getEmployeeById: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.get(`/employees/${id}`);
      if (apiRes?.success && apiRes?.data) {
        return populateEmployee(apiRes.data);
      }
    } catch (err) {
      console.warn(`[employeeService] Live getEmployeeById(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const emp = getRawEmployees().find((e) => e.id === id);
        resolve(emp ? populateEmployee(emp) : null);
      }, 200);
    });
  },

  createEmployee: async (data) => {
    try {
      const apiRes = await apiClient.post('/employees', data);
      if (apiRes?.success && apiRes?.data) {
        return { success: true, employee: populateEmployee(apiRes.data) };
      }
      return { success: false, error: apiRes?.message || 'Failed to create employee record.' };
    } catch (err) {
      console.error('[employeeService] Live createEmployee failed:', err);
      const detailedErrors = err.data?.errors || err.response?.data?.errors;
      const errorMsg =
        detailedErrors && Array.isArray(detailedErrors)
          ? detailedErrors.map((e) => e.message || `${e.field}: invalid`).join(', ')
          : (err.data?.message || err.response?.data?.message || err.message || 'Failed to create employee record.');
      return {
        success: false,
        error: errorMsg
      };
    }
  },

  updateEmployee: async (id, data) => {
    try {
      const apiRes = await apiClient.put(`/employees/${id}`, data);
      if (apiRes?.success && apiRes?.data) {
        return { success: true, employee: populateEmployee(apiRes.data) };
      }
      return { success: false, error: apiRes?.message || 'Failed to update employee record.' };
    } catch (err) {
      console.error(`[employeeService] Live updateEmployee(${id}) failed:`, err);
      const detailedErrors = err.data?.errors || err.response?.data?.errors;
      const errorMsg =
        detailedErrors && Array.isArray(detailedErrors)
          ? detailedErrors.map((e) => e.message || `${e.field}: invalid`).join(', ')
          : (err.data?.message || err.response?.data?.message || err.message || 'Failed to update employee record.');
      return {
        success: false,
        error: errorMsg
      };
    }
  },

  deleteEmployee: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.delete(`/employees/${id}`);
      if (apiRes?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn(`[employeeService] Live deleteEmployee(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const employees = getRawEmployees().filter((e) => e.id !== id);
        setRawEmployees(employees);
        resolve({ success: true });
      }, 200);
    });
  },

  // Lookup Entities Option Getters
  getDepartmentOptions: async () => {
    try {
      const apiRes = await apiClient.get('/departments', { limit: 100 });
      if (apiRes?.success && Array.isArray(apiRes.data)) return apiRes.data;
    } catch {
      // Fallback
    }
    return getRawDepartments();
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
      console.warn('[employeeService] Live getJobPositionOptions failed:', err.message);
    }
    if (departmentId) {
      return getRawJobPositions()
        .filter((p) => String(p.department_id) === String(departmentId))
        .map((p) => ({
          id: p.id,
          title: p.title || p.name,
          code: p.code,
          department_id: p.department_id,
        }));
    }
    return getRawJobPositions().map((p) => ({
      id: p.id,
      title: p.title || p.name,
      code: p.code,
      department_id: p.department_id,
    }));
  },

  getManagerOptions: async (excludeEmployeeId = null) => {
    try {
      const apiRes = await apiClient.get('/employees', { pageSize: 100 });
      if (apiRes?.success && Array.isArray(apiRes.data)) {
        return apiRes.data
          .filter((e) => e.id !== excludeEmployeeId)
          .map((e) => ({
            id: e.id,
            name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.fullName || e.name,
          }));
      }
    } catch {
      // Fallback
    }
    return getRawEmployees()
      .filter((e) => e.id !== excludeEmployeeId)
      .map((e) => ({
        id: e.id,
        name: `${e.first_name} ${e.last_name}`,
      }));
  },

  getScheduleOptions: async () => {
    try {
      const apiRes = await apiClient.get('/schedules');
      if (apiRes?.success && Array.isArray(apiRes.data)) return apiRes.data;
    } catch {
      // Fallback
    }
    return getRawSchedules();
  },

  // Raw State Accessors for Master Data Services
  _getRawDepartments: () => getRawDepartments(),
  _setRawDepartments: (depts) => setRawDepartments(depts),
  _getRawJobPositions: () => getRawJobPositions(),
  _setRawJobPositions: (positions) => setRawJobPositions(positions),
  _getRawEmployees: () => getRawEmployees(),
  _setRawEmployees: (employees) => setRawEmployees(employees),
  _getRawSchedules: () => getRawSchedules(),
  _setRawSchedules: (schedules) => setRawSchedules(schedules),
  _getRawAttendance: () => getRawAttendance(),
  _setRawAttendance: (records) => setRawAttendance(records),
  _getRawTimeOffTypes: () => getRawTimeOffTypes(),
  _setRawTimeOffTypes: (types) => setRawTimeOffTypes(types),
  _getRawTimeOffAllocations: () => getRawTimeOffAllocations(),
  _setRawTimeOffAllocations: (allocations) => setRawTimeOffAllocations(allocations),
  _getRawTimeOffRequests: () => getRawTimeOffRequests(),
  _setRawTimeOffRequests: (requests) => setRawTimeOffRequests(requests),
  _getRawSalaryStructures: () => getRawSalaryStructures(),
  _setRawSalaryStructures: (structures) => setRawSalaryStructures(structures),
  _getRawSalaryRuleCategories: () => getRawSalaryRuleCategories(),
  _setRawSalaryRuleCategories: (categories) => setRawSalaryRuleCategories(categories),
  _getRawSalaryRules: () => getRawSalaryRules(),
  _setRawSalaryRules: (rules) => setRawSalaryRules(rules),
  _getRawContracts: () => getRawContracts(),
  _setRawContracts: (contracts) => setRawContracts(contracts),
  _getRawPayruns: () => getRawPayruns(),
  _setRawPayruns: (payruns) => setRawPayruns(payruns),
  _getRawPayrunEmployees: () => getRawPayrunEmployees(),
  _setRawPayrunEmployees: (pres) => setRawPayrunEmployees(pres),
  _getRawPayslips: () => getRawPayslips(),
  _setRawPayslips: (slips) => setRawPayslips(slips),
  _getRawPayslipLines: () => getRawPayslipLines(),
  _setRawPayslipLines: (lines) => setRawPayslipLines(lines),
};

export default employeeService;
