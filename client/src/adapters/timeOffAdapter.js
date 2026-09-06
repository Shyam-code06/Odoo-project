/**
 * Time Off Adapter
 * Transforms database-shaped Types, Allocations, and Requests into UI models.
 */

import { calculateRemainingBalance } from '../utils/timeOffCalculator';

export const timeOffTypeAdapter = {
  toUIModel: (type) => {
    if (!type) return null;
    return {
      id: type.id,
      name: type.name || '',
      code: type.code || '',
      unit: type.unit || 'days', // 'days' | 'hours'
      requiresAllocation: type.requiresAllocation ?? type.requires_allocation ?? true,
      requiresApproval: type.requiresApproval ?? type.requires_approval ?? true,
      isPaid: type.isPaid ?? type.is_paid ?? true,
      isActive: type.isActive ?? type.is_active ?? true,
    };
  },

  toAPIModel: (uiData) => {
    return {
      name: uiData.name ? uiData.name.trim() : '',
      code: uiData.code ? uiData.code.trim().toUpperCase() : '',
      unit: uiData.unit || 'days',
      requires_allocation: Boolean(uiData.requiresAllocation),
      requires_approval: Boolean(uiData.requiresApproval),
      is_paid: Boolean(uiData.isPaid),
      is_active: Boolean(uiData.isActive),
    };
  },
};

export const timeOffAllocationAdapter = {
  toUIModel: (alloc, employees = [], timeOffTypes = []) => {
    if (!alloc) return null;

    const employeeId = alloc.employeeId || alloc.employee_id;
    const timeOffTypeId = alloc.timeOffTypeId || alloc.time_off_type_id;

    const emp = employees.find((e) => String(e.id) === String(employeeId));
    const type = timeOffTypes.find((t) => String(t.id) === String(timeOffTypeId));

    const allocatedAmount = Number(alloc.allocatedAmount ?? alloc.allocated_amount ?? 0);
    const usedAmount = Number(alloc.usedAmount ?? alloc.used_amount ?? 0);
    const remainingAmount = calculateRemainingBalance(allocatedAmount, usedAmount);
    const usedPercentage = allocatedAmount > 0 
      ? Math.min(100, Math.round((usedAmount / allocatedAmount) * 100)) 
      : 0;

    return {
      id: alloc.id,
      employeeId,
      employee: emp
        ? {
            id: emp.id,
            name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : emp.name || 'Unknown',
            code: emp.employee_code || emp.code || '',
            avatar: emp.avatar || '',
            departmentName: emp.department_name || emp.department || '',
            jobTitle: emp.job_title || emp.jobPosition || '',
          }
        : { id: employeeId, name: 'Unknown Employee', code: '', avatar: '' },
      timeOffTypeId,
      timeOffType: type
        ? {
            id: type.id,
            name: type.name,
            code: type.code,
            unit: type.unit,
          }
        : { id: timeOffTypeId, name: 'Unknown Type', code: '', unit: 'days' },
      startDate: alloc.startDate || alloc.start_date || '',
      endDate: alloc.endDate || alloc.end_date || '',
      allocatedAmount,
      usedAmount,
      remainingAmount,
      usedPercentage,
      status: (alloc.status || 'pending').toLowerCase(),
      approvedBy: alloc.approvedBy || alloc.approved_by || null,
      approvedAt: alloc.approvedAt || alloc.approved_at || null,
      createdAt: alloc.createdAt || alloc.created_at || new Date().toISOString(),
      updatedAt: alloc.updatedAt || alloc.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      employee_id: uiData.employeeId,
      time_off_type_id: uiData.timeOffTypeId,
      start_date: uiData.startDate,
      end_date: uiData.endDate,
      allocated_amount: Number(uiData.allocatedAmount || 0),
      used_amount: Number(uiData.usedAmount || 0),
      status: uiData.status || 'pending',
      approved_by: uiData.approvedBy || null,
      approved_at: uiData.approvedAt || null,
    };
  },
};

export const timeOffRequestAdapter = {
  toUIModel: (req, employees = [], timeOffTypes = [], allocations = []) => {
    if (!req) return null;

    const employeeId = req.employeeId || req.employee_id;
    const timeOffTypeId = req.timeOffTypeId || req.time_off_type_id;
    const allocationId = req.allocationId || req.allocation_id;

    const emp = employees.find((e) => e.id === employeeId);
    const type = timeOffTypes.find((t) => t.id === timeOffTypeId);
    const alloc = allocations.find((a) => a.id === allocationId);

    return {
      id: req.id,
      employeeId,
      employee: emp
        ? {
            id: emp.id,
            name: emp.first_name ? `${emp.first_name} ${emp.last_name || ''}`.trim() : emp.name || 'Unknown',
            code: emp.employee_code || emp.code || '',
            avatar: emp.avatar || '',
            departmentName: emp.department_name || emp.department || '',
            jobTitle: emp.job_title || emp.jobPosition || '',
            managerName: emp.manager_name || emp.manager || 'Direct Manager',
          }
        : {
            id: employeeId,
            name: req.first_name ? `${req.first_name} ${req.last_name || ''}`.trim() : 'Employee',
            code: req.employee_code || `EMP-${employeeId}`,
            avatar: '',
            departmentName: req.department_name || '',
            jobTitle: req.job_title || '',
            managerName: 'Direct Manager',
          },
      timeOffTypeId,
      timeOffType: type
        ? {
            id: type.id,
            name: type.name,
            code: type.code,
            unit: type.unit,
            requiresAllocation: type.requiresAllocation ?? type.requires_allocation ?? true,
            requiresApproval: type.requiresApproval ?? type.requires_approval ?? true,
          }
        : {
            id: timeOffTypeId,
            name: req.leave_type_name || req.time_off_type_name || 'Leave',
            code: req.leave_type_code || 'LV',
            unit: req.unit || 'days',
            requiresAllocation: true,
            requiresApproval: true,
          },
      allocationId: allocationId || null,
      allocation: alloc
        ? {
            id: alloc.id,
            allocatedAmount: Number(alloc.allocatedAmount ?? alloc.allocated_amount ?? 0),
            usedAmount: Number(alloc.usedAmount ?? alloc.used_amount ?? 0),
            remainingAmount: calculateRemainingBalance(
              alloc.allocatedAmount ?? alloc.allocated_amount ?? 0,
              alloc.usedAmount ?? alloc.used_amount ?? 0
            ),
            startDate: alloc.startDate || alloc.start_date,
            endDate: alloc.endDate || alloc.end_date,
          }
        : null,
      startDate: req.startDate || req.start_date || '',
      endDate: req.endDate || req.end_date || '',
      duration: Number(req.duration || 0),
      reason: req.reason || '',
      status: (req.status || 'pending').toLowerCase(),
      approvedBy: req.approvedBy || req.approved_by || null,
      approvedAt: req.approvedAt || req.approved_at || null,
      rejectedReason: req.rejectedReason || req.rejected_reason || null,
      createdAt: req.createdAt || req.created_at || new Date().toISOString(),
      updatedAt: req.updatedAt || req.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      employee_id: uiData.employeeId,
      time_off_type_id: uiData.timeOffTypeId,
      allocation_id: uiData.allocationId || null,
      start_date: uiData.startDate,
      end_date: uiData.endDate,
      duration: Number(uiData.duration || 0),
      reason: uiData.reason || '',
      status: uiData.status || 'pending',
      approved_by: uiData.approvedBy || null,
      approved_at: uiData.approvedAt || null,
      rejected_reason: uiData.rejectedReason || null,
    };
  },
};
