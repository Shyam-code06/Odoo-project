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

// Helper to populate reference entity names
const populateEmployee = (emp) => {
  if (!emp) return null;
  const dept = getRawDepartments().find((d) => d.id === emp.department_id);
  const pos = getRawJobPositions().find((p) => p.id === emp.job_position_id);
  const mgr = getRawEmployees().find((m) => m.id === emp.manager_id);
  const sched = getRawSchedules().find((s) => s.id === emp.working_schedule_id);

  return {
    ...emp,
    fullName: `${emp.first_name} ${emp.last_name}`,
    departmentName: dept ? dept.name : 'Unassigned',
    jobPositionTitle: pos ? pos.title : 'Unassigned',
    managerName: mgr ? `${mgr.first_name} ${mgr.last_name}` : 'None (Top Level)',
    workingScheduleName: sched ? sched.name : 'Standard Shift',
    relatedCounts: {
      contracts: 2,
      attendance: 24,
      timeOff: 3,
      allocations: 4,
    },
  };
};

export const employeeService = {
  getEmployees: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let result = getRawEmployees().map(populateEmployee);

        // Search filter (Name, Code, Email)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          result = result.filter(
            (e) =>
              e.fullName.toLowerCase().includes(q) ||
              e.employee_code.toLowerCase().includes(q) ||
              e.email.toLowerCase().includes(q)
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
            (e) => e.employment_status.toLowerCase() === params.employment_status.toLowerCase()
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
    return new Promise((resolve) => {
      setTimeout(() => {
        const emp = getRawEmployees().find((e) => e.id === id);
        resolve(emp ? populateEmployee(emp) : null);
      }, 200);
    });
  },

  createEmployee: async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const employees = getRawEmployees();
        const newId = `emp-${Date.now()}`;
        const autoCode = data.employee_code || `EMP-2026-${String(employees.length + 1).padStart(3, '0')}`;

        const newEmp = {
          id: newId,
          employee_code: autoCode,
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          address: data.address || '',
          department_id: data.department_id || 'dept-001',
          job_position_id: data.job_position_id || 'pos-001',
          manager_id: data.manager_id || null,
          joining_date: data.joining_date || new Date().toISOString().split('T')[0],
          employment_status: data.employment_status || 'Active',
          working_schedule_id: data.working_schedule_id || 'sched-001',
          avatar: data.avatar || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        employees.unshift(newEmp);
        setRawEmployees(employees);
        resolve({ success: true, employee: populateEmployee(newEmp) });
      }, 300);
    });
  },

  updateEmployee: async (id, data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const employees = getRawEmployees();
        const idx = employees.findIndex((e) => e.id === id);
        if (idx === -1) {
          resolve({ success: false, error: 'Employee record not found.' });
          return;
        }

        const updated = {
          ...employees[idx],
          ...data,
          updated_at: new Date().toISOString(),
        };

        employees[idx] = updated;
        setRawEmployees(employees);
        resolve({ success: true, employee: populateEmployee(updated) });
      }, 300);
    });
  },

  deleteEmployee: async (id) => {
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
    return getRawDepartments();
  },

  getJobPositionOptions: async (departmentId = null) => {
    if (departmentId) {
      return getRawJobPositions().filter((p) => p.department_id === departmentId);
    }
    return getRawJobPositions();
  },

  getManagerOptions: async (excludeEmployeeId = null) => {
    return getRawEmployees().filter((e) => e.id !== excludeEmployeeId).map((e) => ({
      id: e.id,
      name: `${e.first_name} ${e.last_name}`,
    }));
  },

  getScheduleOptions: async () => {
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
