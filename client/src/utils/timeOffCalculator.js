/**
 * Time Off Calculation and Validation Utilities
 */

/**
 * Calculates duration in days or hours between start and end date strings (YYYY-MM-DD)
 * @param {string} startDate 
 * @param {string} endDate 
 * @param {'days' | 'hours'} unit 
 * @param {number} [customHours] - Optional custom hours override for hourly leave
 * @returns {number}
 */
export const calculateRequestDuration = (startDate, endDate, unit = 'days', customHours = null) => {
  if (!startDate || !endDate) return 0;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  if (end < start) return 0;

  // Day difference (inclusive of start date)
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (unit === 'hours') {
    if (customHours && customHours > 0) {
      return customHours;
    }
    // Standard 8 hours per workday assumption
    return diffDays * 8;
  }

  return diffDays;
};

/**
 * Calculates remaining balance from allocated and used amount
 * @param {number} allocatedAmount 
 * @param {number} usedAmount 
 * @returns {number}
 */
export const calculateRemainingBalance = (allocatedAmount = 0, usedAmount = 0) => {
  const remaining = Number(allocatedAmount || 0) - Number(usedAmount || 0);
  return Math.max(0, Number(remaining.toFixed(2)));
};

/**
 * Filters valid, active, non-expired allocations for an employee and leave type
 * @param {string} employeeId 
 * @param {string} timeOffTypeId 
 * @param {string} requestStartDate 
 * @param {string} requestEndDate 
 * @param {Array} allocations 
 * @returns {Array}
 */
export const getEligibleAllocations = (
  employeeId,
  timeOffTypeId,
  requestStartDate,
  requestEndDate,
  allocations = []
) => {
  if (!employeeId || !timeOffTypeId || !allocations.length) return [];

  const reqStart = requestStartDate ? new Date(requestStartDate) : null;
  const reqEnd = requestEndDate ? new Date(requestEndDate) : null;

  return allocations.filter((alloc) => {
    // Must match employee and type
    if (alloc.employeeId !== employeeId && alloc.employee_id !== employeeId) return false;
    if (alloc.timeOffTypeId !== timeOffTypeId && alloc.time_off_type_id !== timeOffTypeId) return false;
    
    // Must be approved
    const status = alloc.status ? alloc.status.toLowerCase() : '';
    if (status !== 'approved') return false;

    // Check remaining balance
    const allocated = alloc.allocatedAmount ?? alloc.allocated_amount ?? 0;
    const used = alloc.usedAmount ?? alloc.used_amount ?? 0;
    const remaining = calculateRemainingBalance(allocated, used);
    if (remaining <= 0) return false;

    // Check validity dates if request dates provided
    if (reqStart && alloc.startDate) {
      const allocStart = new Date(alloc.startDate || alloc.start_date);
      if (allocStart > reqStart) return false;
    }
    if (reqEnd && alloc.endDate) {
      const allocEnd = new Date(alloc.endDate || alloc.end_date);
      if (allocEnd < reqEnd) return false;
    }

    return true;
  });
};

/**
 * Validates whether the requested leave duration exceeds remaining balance
 * @param {number} duration 
 * @param {number} remainingBalance 
 * @returns {{ valid: boolean, message?: string }}
 */
export const validateLeaveBalance = (duration, remainingBalance) => {
  if (!duration || duration <= 0) {
    return { valid: false, message: 'Invalid leave duration.' };
  }
  if (duration > remainingBalance) {
    return {
      valid: false,
      message: `Insufficient leave balance for this request. Requested: ${duration}, Remaining: ${remainingBalance}`,
    };
  }
  return { valid: true };
};
