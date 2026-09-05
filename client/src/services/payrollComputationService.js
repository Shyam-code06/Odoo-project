import { employeeService } from './employeeService';
import { salaryRuleAdapter } from '../adapters/salaryAdapter';
import { payslipAdapter } from '../adapters/payrunAdapter';
import { calculateSalaryStructure } from '../utils/salaryCalculationEngine';

/**
 * Payroll Computation & Warning Analysis Engine
 * Integrates Part 09 Salary Calculation Engine with employee contract base wages.
 */

export const payrollComputationService = {
  /**
   * Computes batch payroll for all employees attached to a Payrun.
   */
  computePayrunBatch: async (payrun, payrunEmployees = []) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawStructs = employeeService._getRawSalaryStructures() || [];
        const rawCategories = employeeService._getRawSalaryRuleCategories() || [];
        const rawRules = employeeService._getRawSalaryRules() || [];
        const rawContracts = employeeService._getRawContracts() || [];
        const rawEmployees = employeeService._getRawEmployees() || [];
        let rawPayslips = [...(employeeService._getRawPayslips() || [])];
        let rawPayslipLines = [...(employeeService._getRawPayslipLines() || [])];

        const targetStructure = rawStructs.find((s) => s.id === payrun.salaryStructureId);
        if (!targetStructure) {
          resolve({
            success: false,
            message: `Salary Structure ${payrun.salaryStructureId} not found.`,
          });
          return;
        }

        // Get active rules for structure ordered by sequence ASC
        const uiRules = rawRules
          .filter((r) => r.salary_structure_id === payrun.salaryStructureId && r.is_active)
          .map((r) => salaryRuleAdapter.toUIModel(r, rawStructs, rawCategories))
          .filter(Boolean)
          .sort((a, b) => a.sequence - b.sequence);

        let computedCount = 0;
        let errorCount = 0;
        let batchGross = 0;
        let batchDeductions = 0;
        let batchNet = 0;

        const warnings = [];
        const errors = [];
        const updatedPEs = [];

        payrunEmployees.forEach((pe) => {
          const emp = rawEmployees.find((e) => e.id === pe.employeeId);
          const contract = rawContracts.find((c) => c.id === pe.contractId);
          const empName = emp ? `${emp.first_name} ${emp.last_name}` : pe.employeeId;

          // Check 1: Missing contract
          if (!contract) {
            errorCount++;
            errors.push({
              employeeId: pe.employeeId,
              employeeName: empName,
              code: 'ERR_MISSING_CONTRACT',
              message: `No active employment contract found for ${empName}.`,
            });
            updatedPEs.push({
              ...pe,
              status: 'error',
              errorMessage: `Missing active contract.`,
            });
            return;
          }

          // Check 2: Missing bank details warning
          if (contract.has_bank_details === false) {
            warnings.push({
              employeeId: pe.employeeId,
              employeeName: empName,
              code: 'WARN_MISSING_BANK',
              severity: 'warning',
              message: `Employee ${empName} has incomplete bank payout details.`,
            });
          }

          // Check 3: Duplicate Payslip detection
          const existingSlip = rawPayslips.find(
            (ps) =>
              ps.employee_id === pe.employeeId &&
              ps.period_start === payrun.periodStart &&
              ps.period_end === payrun.periodEnd &&
              ps.payrun_id !== payrun.id
          );
          if (existingSlip) {
            warnings.push({
              employeeId: pe.employeeId,
              employeeName: empName,
              code: 'WARN_DUPLICATE_PAYSLIP',
              severity: 'warning',
              message: `Employee ${empName} already has a payslip for period ${payrun.periodStart} to ${payrun.periodEnd}.`,
            });
          }

          // Run Part 09 Calculation Engine against contract base wage
          const baseWage = Number(contract.wage || 50000);
          const calcResult = calculateSalaryStructure(targetStructure, uiRules, baseWage);

          const slipId = `slip-${payrun.id}-${pe.employeeId}`;

          const newSlip = {
            id: slipId,
            payrun_id: payrun.id,
            employee_id: pe.employeeId,
            contract_id: contract.id,
            salary_structure_id: payrun.salaryStructureId,
            period_start: payrun.periodStart,
            period_end: payrun.periodEnd,
            gross_salary: calcResult.gross,
            total_deductions: calcResult.deductions,
            net_salary: calcResult.net,
            status: 'generated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          // Generate Payslip Lines
          const newLines = (calcResult.lines || []).map((line, idx) => ({
            id: `line-${slipId}-${idx}`,
            payslip_id: slipId,
            salary_rule_id: line.ruleId,
            name: line.ruleName,
            code: line.ruleCode,
            category: line.categoryCode,
            sequence: line.sequence,
            amount: line.amount,
            quantity: 1,
            rate: undefined,
            calculation_details: line.calculationDetails || '',
          }));

          // Replace existing payslip for this payrun & employee
          rawPayslips = rawPayslips.filter((ps) => ps.id !== slipId);
          rawPayslipLines = rawPayslipLines.filter((l) => l.payslip_id !== slipId);

          rawPayslips.push(newSlip);
          rawPayslipLines.push(...newLines);

          computedCount++;
          batchGross += calcResult.gross;
          batchDeductions += calcResult.deductions;
          batchNet += calcResult.net;

          updatedPEs.push({
            ...pe,
            status: 'computed',
            errorMessage: null,
          });
        });

        // Save mock state updates
        employeeService._setRawPayslips(rawPayslips);
        employeeService._setRawPayslipLines(rawPayslipLines);

        resolve({
          success: true,
          data: {
            payrunEmployees: updatedPEs,
            computedCount,
            errorCount,
            batchGross,
            batchDeductions,
            batchNet,
            warnings,
            errors,
          },
        });
      }, 300);
    });
  },
};
