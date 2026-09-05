import { employeeService } from './employeeService';
import { payslipAdapter } from '../adapters/payrunAdapter';
import { validatePayslipTotals } from '../utils/payslipGrouping';
import { apiClient } from './apiClient';

/**
 * Payslip Master Service Layer
 * Manages presentation, searching, multi-filtering, sorting, integrity verification,
 * and relationship resolution for employee payslips.
 * Integrates production HTTP API Client with automatic fallback to mock store.
 */

export const payslipService = {
  // ==========================================
  // 1. PAYSLIP LIST & SEARCH
  // ==========================================

  getPayslips: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const endpoint = params.isSelfService || params.employeeId ? '/payslips/my' : '/payslips';
      const queryParams = { ...params };
      delete queryParams.isSelfService;

      const apiRes = await apiClient.get(endpoint, queryParams);
      if (apiRes && apiRes.success && Array.isArray(apiRes.data)) {
        const rawList = apiRes.data;
        const formattedItems = rawList.map((row) => ({
          id: row.id,
          employeeId: row.employee_id,
          employeeName: `${row.employee_first_name || ''} ${row.employee_last_name || ''}`.trim() || 'Employee',
          employeeCode: row.employee_code || '',
          employeeAvatar: '',
          departmentId: row.department_id,
          departmentName: row.department_name || 'Unassigned',
          employmentType: row.employment_type || 'Full-time',
          payrunId: row.payrun_id,
          payrunName: row.payrun_name || `Payrun #${row.payrun_id}`,
          salaryStructureId: row.salary_structure_id,
          structureName: row.structure_name || 'Standard Structure',
          periodStart: row.period_start,
          periodEnd: row.period_end,
          grossSalary: Number(row.gross_salary || 0),
          totalDeductions: Number(row.total_deductions || 0),
          netSalary: Number(row.net_salary || 0),
          status: (row.status || 'generated').toLowerCase(),
          emailSentAt: row.email_sent_at || null,
          pdfPath: row.pdf_path || null,
        }));

        const totalCount = apiRes.pagination?.total || formattedItems.length;
        const page = apiRes.pagination?.page || params.page || 1;
        const pageSize = apiRes.pagination?.limit || params.pageSize || 10;
        const totalPages = apiRes.pagination?.totalPages || Math.ceil(totalCount / pageSize) || 1;

        const metrics = {
          total: totalCount,
          generatedCount: formattedItems.filter((s) => s.status === 'generated' || s.status === 'computed').length,
          paidCount: formattedItems.filter((s) => s.status === 'paid').length,
          totalNetPayroll: Number(formattedItems.reduce((sum, s) => sum + s.netSalary, 0).toFixed(2)),
        };

        return {
          success: true,
          data: {
            items: formattedItems,
            total: totalCount,
            page,
            pageSize,
            totalPages,
            metrics,
          },
        };
      }
    } catch (err) {
      console.warn('[payslipService] Live getPayslips failed, fallback to local store:', err.message);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSlips = employeeService._getRawPayslips() || [];
        const rawLines = employeeService._getRawPayslipLines() || [];
        const rawEmployees = employeeService._getRawEmployees() || [];
        const rawContracts = employeeService._getRawContracts() || [];
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawPayruns = employeeService._getRawPayruns() || [];
        const rawDepts = employeeService._getRawDepartments() || [];

        let items = rawSlips.map((slip) => {
          const uiSlip = payslipAdapter.toUIModel(slip, rawLines);
          const emp = rawEmployees.find((e) => e.id === uiSlip.employeeId);
          const contract = rawContracts.find((c) => c.id === uiSlip.contractId);
          const struct = rawStructs.find((s) => s.id === uiSlip.salaryStructureId);
          const payrun = rawPayruns.find((p) => p.id === uiSlip.payrunId);
          const dept = emp ? rawDepts.find((d) => d.id === emp.department_id) : null;

          const fullName = emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Employee';
          const employeeCode = emp ? emp.employee_code || '' : '';
          const departmentName = dept ? dept.name : 'Unassigned';
          const departmentId = emp ? emp.department_id : null;
          const employmentType = contract ? contract.employment_type || 'Full-time' : 'Full-time';
          const payrunName = payrun ? payrun.name : uiSlip.payrunId;
          const structureName = struct ? struct.name : uiSlip.salaryStructureId;

          return {
            ...uiSlip,
            employeeName: fullName,
            employeeCode,
            employeeAvatar: emp ? emp.avatar : '',
            departmentId,
            departmentName,
            employmentType,
            payrunName,
            structureName,
          };
        }).filter(Boolean);

        // Filter by Employee ID (for Self-Service / Employee Portal)
        if (params.employeeId) {
          items = items.filter((item) => item.employeeId === params.employeeId);
        }

        // Filter by Status (Generated | Paid)
        if (params.status && params.status !== 'all') {
          items = items.filter((item) => item.status === params.status.toLowerCase());
        }

        // Filter by Salary Structure
        if (params.salaryStructureId) {
          items = items.filter((item) => item.salaryStructureId === params.salaryStructureId);
        }

        // Filter by Payrun
        if (params.payrunId) {
          items = items.filter((item) => item.payrunId === params.payrunId);
        }

        // Filter by Department
        if (params.departmentId) {
          items = items.filter((item) => item.departmentId === params.departmentId);
        }

        // Filter by Employment Type
        if (params.employmentType) {
          items = items.filter((item) => item.employmentType.toLowerCase() === params.employmentType.toLowerCase());
        }

        // Filter by Email Status (sent | not_sent)
        if (params.emailStatus && params.emailStatus !== 'all') {
          if (params.emailStatus === 'sent') {
            items = items.filter((item) => Boolean(item.emailSentAt));
          } else if (params.emailStatus === 'not_sent') {
            items = items.filter((item) => !item.emailSentAt);
          }
        }

        // Global Search (Employee Name, Code, Payslip ID, Payrun Name)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          items = items.filter(
            (item) =>
              item.id.toLowerCase().includes(q) ||
              item.employeeName.toLowerCase().includes(q) ||
              item.employeeCode.toLowerCase().includes(q) ||
              item.payrunName.toLowerCase().includes(q) ||
              item.structureName.toLowerCase().includes(q)
          );
        }

        // Calculate Summary Metrics across filtered scope
        const metrics = {
          total: items.length,
          generatedCount: items.filter((item) => item.status === 'generated').length,
          paidCount: items.filter((item) => item.status === 'paid').length,
          totalNetPayroll: items.reduce((acc, item) => acc + (Number(item.netSalary) || 0), 0),
        };

        // Sorting (default periodEnd DESC)
        const sortBy = params.sortBy || 'periodEnd';
        const sortDirection = params.sortDirection === 'asc' ? 1 : -1;

        items.sort((a, b) => {
          let valA = a[sortBy] ?? '';
          let valB = b[sortBy] ?? '';

          if (sortBy === 'employeeName') {
            valA = a.employeeName || '';
            valB = b.employeeName || '';
          }

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

  // ==========================================
  // 2. SINGLE PAYSLIP DETAILS & RESOLUTION
  // ==========================================

  getPayslipById: async (id) => {
    try {
      const apiRes = await apiClient.get(`/payslips/${id}`);
      if (apiRes && apiRes.success && apiRes.data) {
        const raw = apiRes.data;
        const lines = (raw.lines || []).map((l) => ({
          id: l.id,
          payslipId: l.payslip_id || id,
          salaryRuleId: l.salary_rule_id,
          name: l.name || '',
          code: l.code || '',
          category: l.category || 'ALW',
          sequence: Number(l.sequence || 10),
          amount: Number(l.amount || 0),
          quantity: Number(l.quantity || 1),
          rate: Number(l.rate || 100),
          calculationDetails: l.calculation_details || '',
        }));

        const uiSlip = {
          id: raw.id,
          payrunId: raw.payrun_id,
          employeeId: raw.employee_id,
          contractId: raw.contract_id,
          salaryStructureId: raw.salary_structure_id,
          periodStart: raw.period_start,
          periodEnd: raw.period_end,
          grossSalary: Number(raw.gross_salary || 0),
          totalDeductions: Number(raw.total_deductions || 0),
          netSalary: Number(raw.net_salary || 0),
          status: (raw.status || 'generated').toLowerCase(),
          pdfPath: raw.pdf_path || null,
          emailSentAt: raw.email_sent_at || null,
          createdAt: raw.created_at || new Date().toISOString(),
          updatedAt: raw.updated_at || new Date().toISOString(),
          lines,
        };

        const employee = {
          id: raw.employee_id,
          employeeCode: raw.employee_code || '',
          fullName: `${raw.employee_first_name || ''} ${raw.employee_last_name || ''}`.trim() || 'Employee',
          email: raw.employee_email || '',
          phone: raw.employee_phone || '',
          departmentName: raw.department_name || 'Engineering',
          jobPositionTitle: raw.job_title || 'Employee',
          avatar: '',
        };

        const contract = raw.contract_id
          ? {
              id: raw.contract_id,
              contractCode: raw.contract_number || 'CON-001',
              wage: Number(raw.base_wage || 0),
              employmentType: raw.employment_type || 'Full-time',
              startDate: raw.start_date,
              endDate: raw.end_date,
              status: 'Active',
              hasBankDetails: true,
            }
          : null;

        const salaryStructure = {
          id: raw.salary_structure_id,
          name: raw.structure_name || 'Salary Structure',
          code: raw.structure_code || '',
          isActive: true,
          ruleCount: lines.length,
        };

        const payrun = {
          id: raw.payrun_id,
          name: raw.payrun_name || `Payrun #${raw.payrun_id}`,
          status: 'validated',
          periodStart: raw.period_start,
          periodEnd: raw.period_end,
          createdBy: 'HR Payroll Admin',
        };

        const integrityCheck = validatePayslipTotals(uiSlip, lines);

        return {
          success: true,
          data: {
            payslip: uiSlip,
            employee,
            contract,
            salaryStructure,
            payrun,
            lines,
            integrityCheck,
            employeeHistory: [],
          },
        };
      }
    } catch (err) {
      console.warn(`[payslipService] Live getPayslipById(${id}) failed, fallback to local store:`, err.message);
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSlips = employeeService._getRawPayslips() || [];
        const slip = rawSlips.find((s) => s.id === id);

        if (!slip) {
          resolve({
            success: false,
            message: `Payslip with ID ${id} not found.`,
          });
          return;
        }

        const rawLines = employeeService._getRawPayslipLines() || [];
        const rawEmployees = employeeService._getRawEmployees() || [];
        const rawContracts = employeeService._getRawContracts() || [];
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawPayruns = employeeService._getRawPayruns() || [];
        const rawDepts = employeeService._getRawDepartments() || [];
        const rawPositions = employeeService._getRawJobPositions() || [];

        const uiSlip = payslipAdapter.toUIModel(slip, rawLines);

        // Resolve Employee
        const empRaw = rawEmployees.find((e) => e.id === uiSlip.employeeId);
        const dept = empRaw ? rawDepts.find((d) => d.id === empRaw.department_id) : null;
        const pos = empRaw ? rawPositions.find((p) => p.id === empRaw.job_position_id) : null;

        const employee = empRaw
          ? {
              id: empRaw.id,
              employeeCode: empRaw.employee_code || '',
              fullName: `${empRaw.first_name || ''} ${empRaw.last_name || ''}`.trim(),
              email: empRaw.email || '',
              departmentName: dept ? dept.name : 'Engineering',
              jobPositionTitle: pos ? pos.title : 'Software Engineer',
              avatar: empRaw.avatar || '',
            }
          : { id: uiSlip.employeeId, fullName: 'Unknown Employee', employeeCode: '' };

        // Resolve Contract
        const contractRaw = rawContracts.find((c) => c.id === uiSlip.contractId);
        const contract = contractRaw
          ? {
              id: contractRaw.id,
              contractCode: contractRaw.contract_code || contractRaw.code || 'CON-001',
              wage: Number(contractRaw.wage || 0),
              employmentType: contractRaw.employment_type || 'Full-time',
              startDate: contractRaw.start_date,
              endDate: contractRaw.end_date,
              status: contractRaw.status || 'Active',
              hasBankDetails: contractRaw.has_bank_details ?? true,
            }
          : null;

        // Resolve Salary Structure
        const structRaw = rawStructs.find((s) => s.id === uiSlip.salaryStructureId);
        const rawRules = employeeService._getRawSalaryRules() || [];
        const structRulesCount = rawRules.filter((r) => r.salary_structure_id === uiSlip.salaryStructureId).length;

        const salaryStructure = structRaw
          ? {
              id: structRaw.id,
              name: structRaw.name,
              code: structRaw.code,
              isActive: structRaw.is_active ?? true,
              ruleCount: structRulesCount || 6,
            }
          : { id: uiSlip.salaryStructureId, name: 'Salary Structure', code: '', isActive: true, ruleCount: 0 };

        // Resolve Payrun Context
        const payrunRaw = rawPayruns.find((p) => p.id === uiSlip.payrunId);
        const payrun = payrunRaw
          ? {
              id: payrunRaw.id,
              name: payrunRaw.name,
              status: (payrunRaw.status || 'draft').toLowerCase(),
              periodStart: payrunRaw.period_start,
              periodEnd: payrunRaw.period_end,
              createdBy: payrunRaw.created_by || 'Admin User',
            }
          : { id: uiSlip.payrunId, name: uiSlip.payrunId, status: 'computed', periodStart: uiSlip.periodStart, periodEnd: uiSlip.periodEnd };

        // Integrity Verification Check
        const integrityCheck = validatePayslipTotals(uiSlip, uiSlip.lines);

        // Fetch Employee Payroll History (Newest first, excluding current payslip)
        const employeeHistory = rawSlips
          .filter((s) => (s.employee_id === uiSlip.employeeId || s.employeeId === uiSlip.employeeId) && s.id !== id)
          .map((s) => {
            const pr = rawPayruns.find((p) => p.id === (s.payrun_id || s.payrunId));
            return {
              id: s.id,
              periodStart: s.period_start || s.periodStart,
              periodEnd: s.period_end || s.periodEnd,
              payrunName: pr ? pr.name : (s.payrun_id || s.payrunId),
              grossSalary: Number(s.gross_salary || s.grossSalary || 0),
              totalDeductions: Number(s.total_deductions || s.totalDeductions || 0),
              netSalary: Number(s.net_salary || s.netSalary || 0),
              status: (s.status || 'generated').toLowerCase(),
            };
          })
          .sort((a, b) => new Date(b.periodEnd) - new Date(a.periodEnd));

        resolve({
          success: true,
          data: {
            payslip: uiSlip,
            employee,
            contract,
            salaryStructure,
            payrun,
            lines: uiSlip.lines,
            integrityCheck,
            employeeHistory,
          },
        });
      }, 150);
    });
  },

  // Helper method to get payslips by employee ID
  getEmployeePayslips: async (employeeId) => {
    return payslipService.getPayslips({ employeeId, pageSize: 50 });
  },

  // Helper method to get payslips by payrun ID
  getPayslipsByPayrun: async (payrunId) => {
    return payslipService.getPayslips({ payrunId, pageSize: 100 });
  },
};

export default payslipService;
