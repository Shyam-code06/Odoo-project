import { employeeService } from './employeeService';

/**
 * Payroll Eligibility & Contract Resolution Service
 * Evaluates contract availability, payroll date coverage, and structure compatibility.
 */

export const payrollEligibilityService = {
  /**
   * Resolves the active employment contract applicable to the specified payroll period.
   */
  getApplicableContract: (employeeId, periodStart, periodEnd) => {
    const rawContracts = employeeService._getRawContracts() || [];
    const pStart = new Date(periodStart);
    const pEnd = new Date(periodEnd);

    const matchingContracts = rawContracts.filter((c) => {
      if (c.employee_id !== employeeId || c.status !== 'Active') return false;

      const cStart = new Date(c.start_date);
      const cEnd = c.end_date ? new Date(c.end_date) : null;

      const startsOnOrBeforePeriodEnd = cStart <= pEnd;
      const endsOnOrAfterPeriodStart = !cEnd || cEnd >= pStart;

      return startsOnOrBeforePeriodEnd && endsOnOrAfterPeriodStart;
    });

    if (matchingContracts.length > 1) {
      return {
        contract: null,
        error: 'Multiple active contracts found for this employee and payroll period.',
        isMultiple: true,
      };
    }

    if (matchingContracts.length === 0) {
      return {
        contract: null,
        error: 'No active contract covering this payroll period.',
        isMissing: true,
      };
    }

    return {
      contract: matchingContracts[0],
      error: null,
    };
  },

  /**
   * Evaluates employee eligibility for inclusion in a Payrun wizard step 2.
   */
  evaluateEmployeeEligibility: (employee, selectedStructureId, periodStart, periodEnd) => {
    const { contract, error } = payrollEligibilityService.getApplicableContract(
      employee.id,
      periodStart,
      periodEnd
    );

    if (error || !contract) {
      return {
        isEligible: false,
        contract: null,
        reason: error || 'Missing applicable contract',
      };
    }

    // Check Salary Structure compatibility
    if (contract.salary_structure_id !== selectedStructureId) {
      const structures = employeeService._getRawSalaryStructures() || [];
      const contractStruct = structures.find((s) => s.id === contract.salary_structure_id);
      const structName = contractStruct ? contractStruct.name : contract.salary_structure_id;

      return {
        isEligible: false,
        contract,
        reason: `Contract uses a different Salary Structure (${structName})`,
      };
    }

    return {
      isEligible: true,
      contract,
      reason: null,
    };
  },

  /**
   * Fetches all employees with their derived eligibility status for a given structure and period.
   */
  getEligibleEmployeesForPayrun: async (selectedStructureId, periodStart, periodEnd) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawEmps = employeeService._getRawEmployees() || [];
        const rawDepts = employeeService._getRawDepartments() || [];
        const rawPositions = employeeService._getRawJobPositions() || [];

        const evaluated = rawEmps.map((emp) => {
          const dept = rawDepts.find((d) => d.id === emp.department_id);
          const pos = rawPositions.find((p) => p.id === emp.job_position_id);

          const { isEligible, contract, reason } = payrollEligibilityService.evaluateEmployeeEligibility(
            emp,
            selectedStructureId,
            periodStart,
            periodEnd
          );

          return {
            id: emp.id,
            employeeCode: emp.employee_code,
            fullName: `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
            departmentId: emp.department_id,
            departmentName: dept ? dept.name : 'Engineering',
            jobPositionTitle: pos ? pos.title : 'Software Engineer',
            avatar: emp.avatar || '',
            contractId: contract ? contract.id : null,
            contractCode: contract ? contract.contract_code : 'N/A',
            wage: contract ? Number(contract.wage) : 0,
            employmentType: contract ? contract.employment_type : 'Full-time',
            hasBankDetails: contract ? contract.has_bank_details ?? true : false,
            isEligible,
            ineligibilityReason: reason,
          };
        });

        resolve({
          success: true,
          data: evaluated,
        });
      }, 150);
    });
  },
};
