/**
 * Payslip Line Grouping & Validation Utility
 * Organizes payslip lines into dynamic categories (Earnings vs Deductions)
 * and verifies mathematical consistency against stored payslip totals.
 */

export const groupPayslipLines = (lines = []) => {
  const earnings = [];
  const deductions = [];
  const other = [];

  // Sort lines by sequence ASC
  const sorted = [...lines].sort((a, b) => (Number(a.sequence) || 0) - (Number(b.sequence) || 0));

  sorted.forEach((line) => {
    const cat = (line.category || '').toUpperCase();
    const code = (line.code || '').toUpperCase();

    // Summary lines (GROSS, DEDUCTIONS, NET) are categorized into summary or omitted from basic tables if desired
    if (code === 'GROSS' || code === 'NET' || code === 'DEDUCTIONS' || cat === 'NET' || cat === 'GROSS') {
      other.push(line);
    } else if (cat === 'DED' || cat === 'DEDUCTION' || cat === 'TAX' || cat === 'PF' || cat === 'PT') {
      deductions.push(line);
    } else {
      // Default BASIC, ALW, ALLOWANCE, BONUS to earnings
      earnings.push(line);
    }
  });

  const earningsTotal = earnings.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
  const deductionsTotal = deductions.reduce((acc, l) => acc + (Number(l.amount) || 0), 0);

  return {
    earnings,
    deductions,
    other,
    earningsTotal,
    deductionsTotal,
  };
};

export const validatePayslipTotals = (payslip, lines = []) => {
  if (!payslip) return { isValid: true, warnings: [] };

  const { earningsTotal, deductionsTotal } = groupPayslipLines(lines);
  const warnings = [];

  const storedGross = Number(payslip.grossSalary || 0);
  const storedDeductions = Number(payslip.totalDeductions || 0);
  const storedNet = Number(payslip.netSalary || 0);

  // Check 1: Earnings total matches Gross Salary (allowing minor rounding delta of 1.0)
  if (lines.length > 0 && Math.abs(earningsTotal - storedGross) > 1.0) {
    warnings.push({
      code: 'WARN_GROSS_MISMATCH',
      severity: 'warning',
      message: `Calculated earnings total (₹${earningsTotal.toLocaleString()}) does not match stored gross salary (₹${storedGross.toLocaleString()}).`,
    });
  }

  // Check 2: Deductions total matches Stored Deductions
  if (lines.length > 0 && Math.abs(deductionsTotal - storedDeductions) > 1.0) {
    warnings.push({
      code: 'WARN_DEDUCTION_MISMATCH',
      severity: 'warning',
      message: `Calculated deduction total (₹${deductionsTotal.toLocaleString()}) does not match stored deductions (₹${storedDeductions.toLocaleString()}).`,
    });
  }

  // Check 3: Net Salary = Gross - Deductions
  const expectedNet = storedGross - storedDeductions;
  if (Math.abs(expectedNet - storedNet) > 1.0) {
    warnings.push({
      code: 'WARN_NET_MISMATCH',
      severity: 'warning',
      message: `Stored net salary (₹${storedNet.toLocaleString()}) differs from expected Net (Gross - Deductions = ₹${expectedNet.toLocaleString()}).`,
    });
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
};
