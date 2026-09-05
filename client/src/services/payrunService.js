import { employeeService } from './employeeService';
import { payrunAdapter, payrunEmployeeAdapter, payslipAdapter } from '../adapters/payrunAdapter';
import { payrollComputationService } from './payrollComputationService';

/**
 * Payrun Master Service
 * Manages Payrun lifecycle (Draft -> Computed -> Validated -> Paid), duplicate checks, and mock persistence.
 */

export const payrunService = {
  // ==========================================
  // 1. PAYRUN LIST & SEARCH
  // ==========================================

  getPayruns: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPayruns = employeeService._getRawPayruns() || [];
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawPEs = employeeService._getRawPayrunEmployees() || [];
        const rawSlips = employeeService._getRawPayslips() || [];

        let items = rawPayruns
          .map((p) => payrunAdapter.toUIModel(p, rawStructs, rawPEs, rawSlips))
          .filter(Boolean);

        // Filter by Status
        if (params.status && params.status !== 'all') {
          items = items.filter((p) => p.status === params.status.toLowerCase());
        }

        // Filter by Salary Structure
        if (params.salaryStructureId) {
          items = items.filter((p) => p.salaryStructureId === params.salaryStructureId);
        }

        // Search (Name, Structure Name, Created By)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          items = items.filter(
            (p) =>
              (p.name && p.name.toLowerCase().includes(q)) ||
              (p.structureName && p.structureName.toLowerCase().includes(q)) ||
              (p.createdBy && p.createdBy.toLowerCase().includes(q))
          );
        }

        // Metric Summary Counters
        const allUIItems = rawPayruns.map((p) => payrunAdapter.toUIModel(p, rawStructs, rawPEs, rawSlips));
        const metrics = {
          total: allUIItems.length,
          draft: allUIItems.filter((p) => p.status === 'draft').length,
          computed: allUIItems.filter((p) => p.status === 'computed').length,
          validated: allUIItems.filter((p) => p.status === 'validated').length,
          paid: allUIItems.filter((p) => p.status === 'paid').length,
        };

        // Sorting (default periodEnd DESC)
        const sortBy = params.sortBy || 'periodEnd';
        const sortDirection = params.sortDirection === 'asc' ? 1 : -1;
        items.sort((a, b) => {
          let valA = a[sortBy] ?? '';
          let valB = b[sortBy] ?? '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const total = items.length;
        const totalPages = Math.ceil(total / pageSize) || 1;
        const paginatedData = items.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          success: true,
          data: {
            items: paginatedData,
            total,
            page,
            pageSize,
            totalPages,
            metrics,
          },
        });
      }, 150);
    });
  },

  getPayrunById: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPayruns = employeeService._getRawPayruns() || [];
        const rawPayrun = rawPayruns.find((p) => p.id === id);
        if (!rawPayrun) {
          resolve({
            success: false,
            message: `Payrun with ID ${id} not found.`,
          });
          return;
        }

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter(
          (pe) => pe.payrun_id === id || pe.payrunId === id
        );
        const rawSlips = (employeeService._getRawPayslips() || []).filter(
          (ps) => ps.payrun_id === id || ps.payrunId === id
        );
        const rawLines = employeeService._getRawPayslipLines() || [];
        const rawEmps = employeeService._getRawEmployees() || [];
        const rawContracts = employeeService._getRawContracts() || [];

        const uiPayrun = payrunAdapter.toUIModel(rawPayrun, rawStructs, rawPEs, rawSlips);

        // Map attached employees with their computed payslip details
        const employees = rawPEs.map((pe) => {
          const slip = rawSlips.find((s) => s.employee_id === pe.employee_id || s.employeeId === pe.employeeId);
          const uiSlip = slip ? payslipAdapter.toUIModel(slip, rawLines) : null;
          return payrunEmployeeAdapter.toUIModel(pe, rawEmps, rawContracts, uiSlip);
        });

        resolve({
          success: true,
          data: {
            ...uiPayrun,
            employees,
          },
        });
      }, 150);
    });
  },

  // ==========================================
  // 2. DUPLICATE CHECK & CREATION WIZARD
  // ==========================================

  checkDuplicatePayrun: async (salaryStructureId, periodStart, periodEnd, excludeId = null) => {
    const rawPayruns = employeeService._getRawPayruns() || [];
    return rawPayruns.some(
      (p) =>
        p.id !== excludeId &&
        p.salary_structure_id === salaryStructureId &&
        p.period_start === periodStart &&
        p.period_end === periodEnd
    );
  },

  createPayrun: async (payload) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const { name, salaryStructureId, periodStart, periodEnd, selectedEmployeeIds = [], createdBy } = payload;

        if (!salaryStructureId) {
          resolve({ success: false, message: 'Salary Structure is required.' });
          return;
        }
        if (!periodStart || !periodEnd) {
          resolve({ success: false, message: 'Period Start and Period End are required.' });
          return;
        }
        if (new Date(periodStart) > new Date(periodEnd)) {
          resolve({ success: false, message: 'Period Start must be on or before Period End.' });
          return;
        }
        if (selectedEmployeeIds.length === 0) {
          resolve({ success: false, message: 'At least one eligible employee must be selected.' });
          return;
        }

        // Duplicate Payrun check
        const isDuplicate = await payrunService.checkDuplicatePayrun(salaryStructureId, periodStart, periodEnd);
        if (isDuplicate) {
          resolve({
            success: false,
            message: 'A Payrun already exists for this Salary Structure and payroll period.',
          });
          return;
        }

        const rawPayruns = [...(employeeService._getRawPayruns() || [])];
        const rawPEs = [...(employeeService._getRawPayrunEmployees() || [])];
        const rawContracts = employeeService._getRawContracts() || [];

        const payrunId = `payrun-${Date.now()}`;
        const autoName = name || `PAYRUN-${periodStart.substring(0, 7)}`;

        const newPayrun = {
          id: payrunId,
          name: autoName,
          salary_structure_id: salaryStructureId,
          period_start: periodStart,
          period_end: periodEnd,
          status: 'draft',
          created_by: createdBy || 'Admin User',
          computed_at: null,
          validated_at: null,
          paid_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Create PayrunEmployee records for each selected employee
        const newPEs = selectedEmployeeIds.map((empId, idx) => {
          const contract = rawContracts.find((c) => c.employee_id === empId && c.status === 'Active');
          return {
            id: `pre-${payrunId}-${idx}`,
            payrun_id: payrunId,
            employee_id: empId,
            contract_id: contract ? contract.id : 'con-001',
            status: 'pending',
            error_message: null,
          };
        });

        rawPayruns.unshift(newPayrun);
        rawPEs.push(...newPEs);

        employeeService._setRawPayruns(rawPayruns);
        employeeService._setRawPayrunEmployees(rawPEs);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        resolve({
          success: true,
          data: payrunAdapter.toUIModel(newPayrun, rawStructs, newPEs, []),
          message: 'Payrun created successfully.',
        });
      }, 250);
    });
  },

  // ==========================================
  // 3. PAYROLL COMPUTATION & LIFECYCLE
  // ==========================================

  computePayrun: async (id) => {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const rawPayruns = [...(employeeService._getRawPayruns() || [])];
        const payrunIdx = rawPayruns.findIndex((p) => p.id === id);
        if (payrunIdx === -1) {
          resolve({ success: false, message: `Payrun with ID ${id} not found.` });
          return;
        }

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawPEs = [...(employeeService._getRawPayrunEmployees() || [])];
        const payrunPEs = rawPEs.filter((pe) => pe.payrun_id === id);

        const uiPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, payrunPEs, []);

        // Run batch payroll computation engine
        const compRes = await payrollComputationService.computePayrunBatch(uiPayrun, payrunPEs);
        if (!compRes.success) {
          resolve(compRes);
          return;
        }

        // Update Payrun status & timestamp
        rawPayruns[payrunIdx] = {
          ...rawPayruns[payrunIdx],
          status: 'computed',
          computed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Update PayrunEmployees
        compRes.data.payrunEmployees.forEach((updatedPE) => {
          const peIdx = rawPEs.findIndex((pe) => pe.id === updatedPE.id);
          if (peIdx !== -1) {
            rawPEs[peIdx] = {
              ...rawPEs[peIdx],
              status: updatedPE.status,
              error_message: updatedPE.errorMessage,
            };
          }
        });

        employeeService._setRawPayruns(rawPayruns);
        employeeService._setRawPayrunEmployees(rawPEs);

        const rawSlips = employeeService._getRawPayslips() || [];
        const updatedUIPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, payrunPEs, rawSlips);

        resolve({
          success: true,
          data: {
            payrun: updatedUIPayrun,
            summary: compRes.data,
          },
          message: `Payroll computed successfully for ${compRes.data.computedCount} employees.`,
        });
      }, 300);
    });
  },

  validatePayrun: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPayruns = [...(employeeService._getRawPayruns() || [])];
        const payrunIdx = rawPayruns.findIndex((p) => p.id === id);
        if (payrunIdx === -1) {
          resolve({ success: false, message: `Payrun with ID ${id} not found.` });
          return;
        }

        const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter((pe) => pe.payrun_id === id);
        const hasErrors = rawPEs.some((pe) => pe.status === 'error');

        if (hasErrors) {
          resolve({
            success: false,
            message: 'Payrun cannot be validated because some employee calculations contain blocking errors.',
          });
          return;
        }

        rawPayruns[payrunIdx] = {
          ...rawPayruns[payrunIdx],
          status: 'validated',
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        employeeService._setRawPayruns(rawPayruns);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawSlips = employeeService._getRawPayslips() || [];
        const updatedUIPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, rawPEs, rawSlips);

        resolve({
          success: true,
          data: updatedUIPayrun,
          message: 'Payrun validated successfully and ready for payout.',
        });
      }, 200);
    });
  },

  markPayrunPaid: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPayruns = [...(employeeService._getRawPayruns() || [])];
        const payrunIdx = rawPayruns.findIndex((p) => p.id === id);
        if (payrunIdx === -1) {
          resolve({ success: false, message: `Payrun with ID ${id} not found.` });
          return;
        }

        const paidTimestamp = new Date().toISOString();

        rawPayruns[payrunIdx] = {
          ...rawPayruns[payrunIdx],
          status: 'paid',
          paid_at: paidTimestamp,
          updated_at: paidTimestamp,
        };

        // Also mark attached payslips as paid
        const rawSlips = [...(employeeService._getRawPayslips() || [])];
        rawSlips.forEach((s, idx) => {
          if (s.payrun_id === id) {
            rawSlips[idx] = { ...s, status: 'paid', updated_at: paidTimestamp };
          }
        });

        employeeService._setRawPayruns(rawPayruns);
        employeeService._setRawPayslips(rawSlips);

        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter((pe) => pe.payrun_id === id);
        const updatedUIPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, rawPEs, rawSlips);

        resolve({
          success: true,
          data: updatedUIPayrun,
          message: 'Payrun marked as Paid and finalized as historical payroll.',
        });
      }, 200);
    });
  },

  deletePayrun: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawPayruns = employeeService._getRawPayruns() || [];
        const payrun = rawPayruns.find((p) => p.id === id);

        if (payrun && payrun.status === 'paid') {
          resolve({
            success: false,
            message: 'Finalized/Paid payruns are historical records and cannot be deleted.',
          });
          return;
        }

        const filteredPayruns = rawPayruns.filter((p) => p.id !== id);
        const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter((pe) => pe.payrun_id !== id);
        const rawSlips = (employeeService._getRawPayslips() || []).filter((s) => s.payrun_id !== id);

        employeeService._setRawPayruns(filteredPayruns);
        employeeService._setRawPayrunEmployees(rawPEs);
        employeeService._setRawPayslips(rawSlips);

        resolve({
          success: true,
          message: 'Payrun deleted successfully.',
        });
      }, 200);
    });
  },
};

export default payrunService;
