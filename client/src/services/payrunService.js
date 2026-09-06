import { employeeService } from './employeeService';
import { payrunAdapter, payrunEmployeeAdapter, payslipAdapter } from '../adapters/payrunAdapter';
import { payrollComputationService } from './payrollComputationService';
import { apiClient } from './apiClient';

/**
 * Payrun Master Service
 * Manages Payrun lifecycle (Draft -> Computed -> Validated -> Paid), duplicate checks,
 * dual-synchronization with backend database and localStorage persistence.
 */

export const payrunService = {
  // ==========================================
  // 1. PAYRUN LIST & SEARCH
  // ==========================================

  getPayruns: async (params = {}) => {
    let backendItems = [];
    try {
      const apiRes = await apiClient.get('/payruns', params);
      if (apiRes?.success && apiRes?.data) {
        backendItems = Array.isArray(apiRes.data)
          ? apiRes.data
          : (apiRes.data.payruns || apiRes.data.items || []);
      }
    } catch (err) {
      console.warn('[payrunService] Backend getPayruns unavailable, using local store:', err.message);
    }

    const localPayruns = employeeService._getRawPayruns() || [];
    const rawStructs = employeeService._getRawSalaryStructures() || [];
    const rawPEs = employeeService._getRawPayrunEmployees() || [];
    const rawSlips = employeeService._getRawPayslips() || [];

    // Deduplicate and combine backend + local payruns
    const backendIds = new Set(backendItems.map((p) => String(p.id)));
    const allRawPayruns = [
      ...backendItems,
      ...localPayruns.filter((p) => !backendIds.has(String(p.id))),
    ];

    let items = allRawPayruns
      .map((p) => payrunAdapter.toUIModel(p, rawStructs, rawPEs, rawSlips))
      .filter(Boolean);

    // Filter by Status
    if (params.status && params.status !== 'all') {
      items = items.filter((p) => p.status?.toLowerCase() === params.status.toLowerCase());
    }

    // Filter by Salary Structure
    if (params.salaryStructureId) {
      items = items.filter((p) => String(p.salaryStructureId) === String(params.salaryStructureId));
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

    const total = items.length;
    const page = Number(params.page) || 1;
    const pageSize = Number(params.pageSize) || 10;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const startIndex = (page - 1) * pageSize;
    const paginatedItems = items.slice(startIndex, startIndex + pageSize);

    const metrics = {
      total: items.length,
      draft: items.filter((p) => p.status?.toLowerCase() === 'draft').length,
      computed: items.filter((p) => p.status?.toLowerCase() === 'computed').length,
      validated: items.filter((p) => p.status?.toLowerCase() === 'validated').length,
      paid: items.filter((p) => p.status?.toLowerCase() === 'paid').length,
    };

    return {
      success: true,
      data: {
        items: paginatedItems,
        total,
        page,
        pageSize,
        totalPages,
        metrics,
      },
    };
  },

  getPayrunById: async (id) => {
    const rawStructs = employeeService._getRawSalaryStructures() || [];
    const rawLines = employeeService._getRawPayslipLines() || [];

    // 1. ALWAYS query backend database first to load real payrun
    let rawPayrun = null;
    try {
      const apiRes = await apiClient.get(`/payruns/${id}`);
      if (apiRes?.success && apiRes?.data) {
        rawPayrun = apiRes.data;
      }
    } catch (err) {
      console.warn(`[payrunService] Backend getPayrunById(${id}) query notice:`, err.message);
    }

    // 2. Fallback to local store only if not found in database
    if (!rawPayrun) {
      const localPayruns = employeeService._getRawPayruns() || [];
      rawPayrun = localPayruns.find((p) => String(p.id) === String(id));
    }

    if (!rawPayrun) {
      return {
        success: false,
        message: `Payrun with ID ${id} not found.`,
      };
    }

    // Load live employees & contracts from database for complete reference
    let rawEmps = [];
    let rawContracts = [];
    try {
      const [empRes, cntRes] = await Promise.all([
        apiClient.get('/employees?limit=500'),
        apiClient.get('/contracts?limit=500'),
      ]);
      if (empRes?.success && empRes?.data) {
        rawEmps = Array.isArray(empRes.data) ? empRes.data : (empRes.data.employees || []);
      }
      if (cntRes?.success && cntRes?.data) {
        rawContracts = Array.isArray(cntRes.data) ? cntRes.data : (cntRes.data.contracts || []);
      }
    } catch {
      rawEmps = employeeService._getRawEmployees() || [];
      rawContracts = employeeService._getRawContracts() || [];
    }

    // ALWAYS prefer backend employees attached to the database payrun!
    const backendPEs = rawPayrun.employees || rawPayrun.payrun_employees || [];
    const localPEs = (employeeService._getRawPayrunEmployees() || []).filter(
      (pe) => String(pe.payrun_id || pe.payrunId) === String(id)
    );
    const attachedPEs = backendPEs.length > 0 ? backendPEs : localPEs;

    const rawSlips = (employeeService._getRawPayslips() || []).filter(
      (ps) => String(ps.payrun_id || ps.payrunId) === String(id)
    );

    const uiPayrun = payrunAdapter.toUIModel(rawPayrun, rawStructs, attachedPEs, rawSlips);

    // Map attached employees with their computed payslip details
    const employees = attachedPEs.map((pe) => {
      const empId = pe.employee_id || pe.employeeId || pe.id;
      const slip = rawSlips.find(
        (s) =>
          String(s.employee_id || s.employeeId) === String(empId) &&
          String(s.payrun_id || s.payrunId) === String(id)
      );
      const uiSlip = slip ? payslipAdapter.toUIModel(slip, rawLines) : null;
      return payrunEmployeeAdapter.toUIModel(pe, rawEmps, rawContracts, uiSlip);
    });

    return {
      success: true,
      data: {
        ...uiPayrun,
        employees,
      },
    };
  },

  // ==========================================
  // 2. DUPLICATE CHECK & CREATION WIZARD
  // ==========================================

  checkDuplicatePayrun: async (salaryStructureId, periodStart, periodEnd, excludeId = null) => {
    const rawPayruns = employeeService._getRawPayruns() || [];
    return rawPayruns.some(
      (p) =>
        String(p.id) !== String(excludeId) &&
        String(p.salary_structure_id || p.salaryStructureId) === String(salaryStructureId) &&
        p.period_start === periodStart &&
        p.period_end === periodEnd
    );
  },

  createPayrun: async (payload) => {
    const { name, salaryStructureId, periodStart, periodEnd, selectedEmployeeIds = [], createdBy } = payload;

    if (!salaryStructureId) {
      return { success: false, message: 'Salary Structure is required.' };
    }
    if (!periodStart || !periodEnd) {
      return { success: false, message: 'Period Start and Period End are required.' };
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      return { success: false, message: 'Period Start must be on or before Period End.' };
    }
    if (selectedEmployeeIds.length === 0) {
      return { success: false, message: 'At least one eligible employee must be selected.' };
    }

    // Duplicate Payrun check
    const isDuplicate = await payrunService.checkDuplicatePayrun(salaryStructureId, periodStart, periodEnd);
    if (isDuplicate) {
      return {
        success: false,
        message: 'A Payrun already exists for this Salary Structure and payroll period.',
      };
    }

    const autoName = name?.trim() || `PAYRUN-${periodStart.substring(0, 7)}`;
    let backendResult = null;

    // 1. Attempt to persist to live backend database
    try {
      const backendPayload = {
        name: autoName,
        salary_structure_id: salaryStructureId ? Number(salaryStructureId) : undefined,
        period_start: periodStart,
        period_end: periodEnd,
        employee_ids: selectedEmployeeIds.map(Number).filter((id) => !isNaN(id) && id > 0),
      };

      const apiRes = await apiClient.post('/payruns', backendPayload);
      if (apiRes?.success && apiRes?.data) {
        backendResult = apiRes.data;
      }
    } catch (err) {
      console.warn('[payrunService] Live backend createPayrun fallback:', err.message);
    }

    // 2. Persist to local store so it NEVER vanishes across reloads or page navigation
    const rawPayruns = [...(employeeService._getRawPayruns() || [])];
    const rawPEs = [...(employeeService._getRawPayrunEmployees() || [])];
    const rawContracts = employeeService._getRawContracts() || [];
    const rawStructs = employeeService._getRawSalaryStructures() || [];

    const payrunId = backendResult?.id ? String(backendResult.id) : `payrun-${Date.now()}`;

    const newPayrun = {
      id: payrunId,
      name: backendResult?.name || autoName,
      salary_structure_id: salaryStructureId,
      salaryStructureId: salaryStructureId,
      period_start: periodStart,
      periodStart: periodStart,
      period_end: periodEnd,
      periodEnd: periodEnd,
      status: 'draft',
      created_by: createdBy || 'Admin User',
      computed_at: null,
      validated_at: null,
      paid_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Create PayrunEmployee records
    const newPEs = selectedEmployeeIds.map((empId, idx) => {
      const contract = rawContracts.find(
        (c) =>
          (String(c.employee_id) === String(empId) || String(c.employeeId) === String(empId)) &&
          String(c.status).toLowerCase() === 'active'
      );
      return {
        id: `pre-${payrunId}-${idx}`,
        payrun_id: payrunId,
        payrunId: payrunId,
        employee_id: empId,
        employeeId: empId,
        contract_id: contract ? contract.id : (rawContracts[0]?.id || 1),
        contractId: contract ? contract.id : (rawContracts[0]?.id || 1),
        status: 'pending',
        error_message: null,
      };
    });

    const filteredPayruns = rawPayruns.filter((p) => String(p.id) !== String(payrunId));
    filteredPayruns.unshift(newPayrun);

    const filteredPEs = rawPEs.filter((pe) => String(pe.payrun_id || pe.payrunId) !== String(payrunId));
    filteredPEs.push(...newPEs);

    employeeService._setRawPayruns(filteredPayruns);
    employeeService._setRawPayrunEmployees(filteredPEs);

    return {
      success: true,
      data: payrunAdapter.toUIModel(newPayrun, rawStructs, newPEs, []),
      message: 'Payrun created successfully.',
    };
  },

  // ==========================================
  // 3. PAYROLL COMPUTATION & LIFECYCLE
  // ==========================================

  computePayrun: async (id) => {
    // Attempt backend compute if numeric ID
    if (!isNaN(Number(id))) {
      try {
        await apiClient.post(`/payruns/${id}/compute`);
      } catch (err) {
        console.warn(`[payrunService] Backend computePayrun(${id}) notice:`, err.message);
      }
    }

    const rawPayruns = [...(employeeService._getRawPayruns() || [])];
    const payrunIdx = rawPayruns.findIndex((p) => String(p.id) === String(id));
    if (payrunIdx === -1) {
      return { success: false, message: `Payrun with ID ${id} not found.` };
    }

    const rawStructs = employeeService._getRawSalaryStructures() || [];
    const rawPEs = [...(employeeService._getRawPayrunEmployees() || [])];
    const payrunPEs = rawPEs.filter((pe) => String(pe.payrun_id || pe.payrunId) === String(id));

    const uiPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, payrunPEs, []);

    // Run batch payroll computation engine
    const compRes = await payrollComputationService.computePayrunBatch(uiPayrun, payrunPEs);
    if (!compRes.success) {
      return compRes;
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
      const peIdx = rawPEs.findIndex((pe) => String(pe.id) === String(updatedPE.id));
      if (peIdx !== -1) {
        rawPEs[peIdx] = {
          ...rawPEs[peIdx],
          status: updatedPE.status,
          error_message: updatedPE.errorMessage,
          errorMessage: updatedPE.errorMessage,
        };
      }
    });

    employeeService._setRawPayruns(rawPayruns);
    employeeService._setRawPayrunEmployees(rawPEs);

    const rawSlips = employeeService._getRawPayslips() || [];
    const freshPEs = rawPEs.filter((pe) => String(pe.payrun_id || pe.payrunId) === String(id));
    const updatedUIPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, freshPEs, rawSlips);

    return {
      success: true,
      data: {
        payrun: updatedUIPayrun,
        summary: compRes.data,
      },
      message: `Payroll computed successfully for ${compRes.data.computedCount} employees.`,
    };
  },

  validatePayrun: async (id) => {
    // Attempt backend validate if numeric ID
    if (!isNaN(Number(id))) {
      try {
        await apiClient.post(`/payruns/${id}/validate`);
      } catch (err) {
        console.warn(`[payrunService] Backend validatePayrun(${id}) notice:`, err.message);
      }
    }

    const rawPayruns = [...(employeeService._getRawPayruns() || [])];
    const payrunIdx = rawPayruns.findIndex((p) => String(p.id) === String(id));
    if (payrunIdx === -1) {
      return { success: false, message: `Payrun with ID ${id} not found.` };
    }

    const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter(
      (pe) => String(pe.payrun_id || pe.payrunId) === String(id)
    );
    const hasErrors = rawPEs.some((pe) => pe.status === 'error');

    if (hasErrors) {
      return {
        success: false,
        message: 'Payrun cannot be validated because some employee calculations contain blocking errors.',
      };
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

    return {
      success: true,
      data: updatedUIPayrun,
      message: 'Payrun validated successfully and ready for payout.',
    };
  },

  markPayrunPaid: async (id) => {
    // Attempt backend mark-paid if numeric ID
    if (!isNaN(Number(id))) {
      try {
        await apiClient.post(`/payruns/${id}/mark-paid`);
      } catch (err) {
        console.warn(`[payrunService] Backend markPayrunPaid(${id}) notice:`, err.message);
      }
    }

    const rawPayruns = [...(employeeService._getRawPayruns() || [])];
    const payrunIdx = rawPayruns.findIndex((p) => String(p.id) === String(id));
    if (payrunIdx === -1) {
      return { success: false, message: `Payrun with ID ${id} not found.` };
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
      if (String(s.payrun_id || s.payrunId) === String(id)) {
        rawSlips[idx] = { ...s, status: 'paid', updated_at: paidTimestamp };
      }
    });

    employeeService._setRawPayruns(rawPayruns);
    employeeService._setRawPayslips(rawSlips);

    const rawStructs = employeeService._getRawSalaryStructures() || [];
    const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter(
      (pe) => String(pe.payrun_id || pe.payrunId) === String(id)
    );
    const updatedUIPayrun = payrunAdapter.toUIModel(rawPayruns[payrunIdx], rawStructs, rawPEs, rawSlips);

    return {
      success: true,
      data: updatedUIPayrun,
      message: 'Payrun marked as Paid and finalized as historical payroll.',
    };
  },

  deletePayrun: async (id) => {
    // Attempt backend delete if numeric ID
    if (!isNaN(Number(id))) {
      try {
        await apiClient.delete(`/payruns/${id}`);
      } catch (err) {
        console.warn(`[payrunService] Backend deletePayrun(${id}) notice:`, err.message);
      }
    }

    const rawPayruns = employeeService._getRawPayruns() || [];
    const payrun = rawPayruns.find((p) => String(p.id) === String(id));

    if (payrun && payrun.status === 'paid') {
      return {
        success: false,
        message: 'Finalized/Paid payruns are historical records and cannot be deleted.',
      };
    }

    const filteredPayruns = rawPayruns.filter((p) => String(p.id) !== String(id));
    const rawPEs = (employeeService._getRawPayrunEmployees() || []).filter(
      (pe) => String(pe.payrun_id || pe.payrunId) !== String(id)
    );
    const rawSlips = (employeeService._getRawPayslips() || []).filter(
      (s) => String(s.payrun_id || s.payrunId) !== String(id)
    );

    employeeService._setRawPayruns(filteredPayruns);
    employeeService._setRawPayrunEmployees(rawPEs);
    employeeService._setRawPayslips(rawSlips);

    return {
      success: true,
      message: 'Payrun deleted successfully.',
    };
  },
};

export default payrunService;
