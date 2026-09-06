/**
 * Payrun & Payslip Adapter Layer
 * Transforms raw database-shaped Payruns, PayrunEmployees, Payslips, and PayslipLines into UI models.
 */

export const payrunAdapter = {
  toUIModel: (payrun, structures = [], payrunEmployees = [], payslips = []) => {
    if (!payrun) return null;

    const struct = structures.find(
      (s) => String(s.id) === String(payrun.salary_structure_id || payrun.salaryStructureId)
    );
    const pes = payrunEmployees.filter(
      (pe) => String(pe.payrun_id || pe.payrunId) === String(payrun.id)
    );
    const slips = payslips.filter(
      (ps) => String(ps.payrun_id || ps.payrunId) === String(payrun.id)
    );

    const grossSalary = slips.reduce((acc, s) => acc + Number(s.gross_salary || s.grossSalary || 0), 0);
    const totalDeductions = slips.reduce((acc, s) => acc + Number(s.total_deductions || s.totalDeductions || 0), 0);
    const netSalary = slips.reduce((acc, s) => acc + Number(s.net_salary || s.netSalary || 0), 0);

    const resolvedEmployeeCount =
      payrun.employeeCount ??
      payrun.employee_counts?.total_employees ??
      payrun.total_employees ??
      (Array.isArray(payrun.employees) ? payrun.employees.length : undefined) ??
      (Array.isArray(payrun.payrun_employees) ? payrun.payrun_employees.length : undefined) ??
      pes.length;

    return {
      id: payrun.id,
      name: payrun.name || '',
      salaryStructureId: payrun.salary_structure_id || payrun.salaryStructureId,
      salaryStructure: struct
        ? { id: struct.id, name: struct.name, code: struct.code }
        : {
            id: payrun.salary_structure_id || payrun.salaryStructureId,
            name: payrun.salary_structure_name || 'Salary Structure',
            code: payrun.salary_structure_code || '',
          },
      structureName: struct ? struct.name : (payrun.salary_structure_name || 'Salary Structure'),
      structureCode: struct ? struct.code : (payrun.salary_structure_code || ''),
      periodStart: payrun.period_start || payrun.periodStart,
      periodEnd: payrun.period_end || payrun.periodEnd,
      status: (payrun.status || 'draft').toLowerCase(),
      createdBy: payrun.creator_email || payrun.created_by || payrun.createdBy || 'System Admin',
      computedAt: payrun.computed_at || payrun.computedAt,
      validatedAt: payrun.validated_at || payrun.validatedAt,
      paidAt: payrun.paid_at || payrun.paidAt,
      employeeCount: resolvedEmployeeCount,
      grossSalary,
      totalDeductions,
      netSalary,
      createdAt: payrun.created_at || payrun.createdAt || new Date().toISOString(),
      updatedAt: payrun.updated_at || payrun.updatedAt || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      name: uiData.name ? uiData.name.trim() : '',
      salary_structure_id: uiData.salaryStructureId,
      period_start: uiData.periodStart,
      period_end: uiData.periodEnd,
      status: uiData.status || 'draft',
      created_by: uiData.createdBy || 'Admin User',
    };
  },
};

export const payrunEmployeeAdapter = {
  toUIModel: (pe, employees = [], contracts = [], payslip = null) => {
    if (!pe) return null;

    const emp = employees.find((e) => String(e.id) === String(pe.employee_id || pe.employeeId));
    const contract = contracts.find(
      (c) =>
        String(c.id) === String(pe.contract_id || pe.contractId) ||
        (String(c.employee_id) === String(pe.employee_id || pe.employeeId) && String(c.status).toLowerCase() === 'active')
    );

    return {
      id: pe.id,
      payrunId: pe.payrun_id || pe.payrunId,
      employeeId: pe.employee_id || pe.employeeId,
      employee: emp
        ? {
            id: emp.id,
            fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.fullName || 'Employee',
            employee_code: emp.employee_code || '',
            departmentName: emp.departmentName || 'Engineering',
            jobPositionTitle: emp.jobPositionTitle || 'Software Engineer',
            avatar: emp.avatar || '',
          }
        : { id: pe.employee_id, fullName: 'Unknown Employee', employee_code: '' },
      contractId: pe.contract_id || pe.contractId,
      contract: contract
        ? {
            id: contract.id,
            contract_code: contract.contract_code || contract.code || 'CON',
            wage: Number(contract.wage || 0),
            employment_type: contract.employment_type || 'Full-time',
            start_date: contract.start_date,
            end_date: contract.end_date,
            has_bank_details: contract.has_bank_details ?? true,
          }
        : null,
      status: (pe.status || 'pending').toLowerCase(),
      errorMessage: pe.error_message || pe.errorMessage || null,
      payslip: payslip || null,
    };
  },
};

export const payslipAdapter = {
  toUIModel: (slip, lines = []) => {
    if (!slip) return null;

    const slipLines = lines.filter((l) => l.payslip_id === slip.id || l.payslipId === slip.id);

    return {
      id: slip.id,
      payrunId: slip.payrun_id || slip.payrunId,
      employeeId: slip.employee_id || slip.employeeId,
      contractId: slip.contract_id || slip.contractId,
      salaryStructureId: slip.salary_structure_id || slip.salaryStructureId,
      periodStart: slip.period_start || slip.periodStart,
      periodEnd: slip.period_end || slip.periodEnd,
      grossSalary: Number(slip.gross_salary || slip.grossSalary || 0),
      totalDeductions: Number(slip.total_deductions || slip.totalDeductions || 0),
      netSalary: Number(slip.net_salary || slip.netSalary || 0),
      status: (slip.status || 'generated').toLowerCase(),
      pdfPath: slip.pdf_path || slip.pdfPath || null,
      emailSentAt: slip.email_sent_at || slip.emailSentAt || null,
      createdAt: slip.created_at || slip.createdAt || new Date().toISOString(),
      updatedAt: slip.updated_at || slip.updatedAt || new Date().toISOString(),
      lines: slipLines.map((l) => ({
        id: l.id,
        payslipId: l.payslip_id || l.payslipId,
        salaryRuleId: l.salary_rule_id || l.salaryRuleId,
        name: l.name || '',
        code: l.code || '',
        category: l.category || 'ALW',
        sequence: Number(l.sequence || 10),
        amount: Number(l.amount || 0),
        quantity: l.quantity !== undefined ? Number(l.quantity) : 1,
        rate: l.rate !== undefined ? Number(l.rate) : undefined,
        calculationDetails: l.calculation_details || l.calculationDetails || '',
      })).sort((a, b) => a.sequence - b.sequence),
    };
  },
};
