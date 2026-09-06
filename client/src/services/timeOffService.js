/**
 * Time Off Service Layer
 * API-ready service managing Time Off Types, Allocations, and Requests.
 */

import { employeeService } from './employeeService';
import {
  timeOffTypeAdapter,
  timeOffAllocationAdapter,
  timeOffRequestAdapter,
} from '../adapters/timeOffAdapter';
import { calculateRemainingBalance, calculateRequestDuration } from '../utils/timeOffCalculator';
import { apiClient } from './apiClient';

export const timeOffService = {
  // ==========================================
  // 1. TIME OFF TYPES MANAGEMENT
  // ==========================================

  getTimeOffTypes: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.get('/time-off/types', params);
      if (apiRes?.success && apiRes?.data) {
        const rawTypes = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.types || [];
        const uiList = rawTypes.map(timeOffTypeAdapter.toUIModel);
        return {
          data: uiList,
          metrics: {
            total: uiList.length,
            active: uiList.filter((t) => t.isActive).length,
            allocationRequired: uiList.filter((t) => t.requiresAllocation && t.isActive).length,
            paidCount: uiList.filter((t) => t.isPaid && t.isActive).length,
          },
          pagination: {
            page: apiRes.pagination?.page || params.page || 1,
            pageSize: apiRes.pagination?.limit || params.pageSize || 10,
            totalItems: apiRes.pagination?.total || uiList.length,
            totalPages: apiRes.pagination?.totalPages || 1,
          },
        };
      }
    } catch (err) {
      console.warn('[timeOffService] Live getTimeOffTypes failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        let types = [...employeeService._getRawTimeOffTypes()].map(timeOffTypeAdapter.toUIModel);

        // Search (Name or Code)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          types = types.filter(
            (t) => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q)
          );
        }

        // Filters
        if (params.unit) {
          types = types.filter((t) => t.unit === params.unit);
        }
        if (params.requiresAllocation !== undefined && params.requiresAllocation !== '') {
          const val = params.requiresAllocation === 'true' || params.requiresAllocation === true;
          types = types.filter((t) => t.requiresAllocation === val);
        }
        if (params.requiresApproval !== undefined && params.requiresApproval !== '') {
          const val = params.requiresApproval === 'true' || params.requiresApproval === true;
          types = types.filter((t) => t.requiresApproval === val);
        }
        if (params.isPaid !== undefined && params.isPaid !== '') {
          const val = params.isPaid === 'true' || params.isPaid === true;
          types = types.filter((t) => t.isPaid === val);
        }
        if (params.isActive !== undefined && params.isActive !== '') {
          const val = params.isActive === 'true' || params.isActive === true;
          types = types.filter((t) => t.isActive === val);
        }

        // Sorting
        const sortBy = params.sortBy || 'name';
        const sortDirection = params.sortDirection === 'desc' ? -1 : 1;
        types.sort((a, b) => {
          let valA = a[sortBy] || '';
          let valB = b[sortBy] || '';
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        // Summary metrics calculation
        const allRawTypes = employeeService._getRawTimeOffTypes().map(timeOffTypeAdapter.toUIModel);
        const metrics = {
          total: allRawTypes.length,
          active: allRawTypes.filter((t) => t.isActive).length,
          allocationRequired: allRawTypes.filter((t) => t.requiresAllocation && t.isActive).length,
          paidCount: allRawTypes.filter((t) => t.isPaid && t.isActive).length,
        };

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const totalItems = types.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const paginatedData = types.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          data: paginatedData,
          metrics,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
          },
        });
      }, 200);
    });
  },

  getTimeOffTypeById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawType = rawTypes.find((t) => t.id === id);
        if (!rawType) {
          reject(new Error(`Time Off Type with ID ${id} not found.`));
          return;
        }
        const uiType = timeOffTypeAdapter.toUIModel(rawType);

        // Derive relational statistics
        const rawAllocations = employeeService._getRawTimeOffAllocations();
        const rawRequests = employeeService._getRawTimeOffRequests();

        const totalAllocations = rawAllocations.filter((a) => a.time_off_type_id === id).length;
        const totalRequests = rawRequests.filter((r) => r.time_off_type_id === id).length;
        
        // Count active unique employees with approved allocations for this type
        const activeEmpIds = new Set(
          rawAllocations
            .filter((a) => a.time_off_type_id === id && a.status === 'approved')
            .map((a) => a.employee_id)
        );

        resolve({
          data: {
            ...uiType,
            totalAllocations,
            totalRequests,
            activeEmployeesCount: activeEmpIds.size,
          },
        });
      }, 150);
    });
  },

  createTimeOffType: async (typeData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawTypes = [...employeeService._getRawTimeOffTypes()];

        // Normalize & Validate
        const name = typeData.name ? typeData.name.trim() : '';
        const code = typeData.code ? typeData.code.trim().toUpperCase() : '';

        if (!name) {
          reject(new Error('Time Off Type name is required.'));
          return;
        }
        if (!code) {
          reject(new Error('Time Off Type code is required.'));
          return;
        }

        // Unique Code Check
        const codeExists = rawTypes.some((t) => t.code.toUpperCase() === code);
        if (codeExists) {
          reject(new Error(`Time Off Type code '${code}' already exists. Code must be unique.`));
          return;
        }

        const newId = `type-${Date.now()}`;
        const apiPayload = {
          id: newId,
          ...timeOffTypeAdapter.toAPIModel({ ...typeData, name, code }),
        };

        rawTypes.unshift(apiPayload);
        employeeService._setRawTimeOffTypes(rawTypes);

        resolve({
          success: true,
          data: timeOffTypeAdapter.toUIModel(apiPayload),
          message: 'Time Off Type created successfully.',
        });
      }, 250);
    });
  },

  updateTimeOffType: async (id, typeData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawTypes = [...employeeService._getRawTimeOffTypes()];
        const index = rawTypes.findIndex((t) => t.id === id);
        if (index === -1) {
          reject(new Error(`Time Off Type with ID ${id} not found.`));
          return;
        }

        const name = typeData.name ? typeData.name.trim() : '';
        const code = typeData.code ? typeData.code.trim().toUpperCase() : '';

        if (!name) {
          reject(new Error('Time Off Type name is required.'));
          return;
        }
        if (!code) {
          reject(new Error('Time Off Type code is required.'));
          return;
        }

        // Unique Code Check (excluding current)
        const codeExists = rawTypes.some((t) => t.id !== id && t.code.toUpperCase() === code);
        if (codeExists) {
          reject(new Error(`Time Off Type code '${code}' is used by another leave type.`));
          return;
        }

        const updatedApiPayload = {
          ...rawTypes[index],
          ...timeOffTypeAdapter.toAPIModel({ ...typeData, name, code }),
        };

        rawTypes[index] = updatedApiPayload;
        employeeService._setRawTimeOffTypes(rawTypes);

        resolve({
          success: true,
          data: timeOffTypeAdapter.toUIModel(updatedApiPayload),
          message: 'Time Off Type updated successfully.',
        });
      }, 250);
    });
  },

  deleteTimeOffType: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocations = employeeService._getRawTimeOffAllocations();
        const rawRequests = employeeService._getRawTimeOffRequests();

        // Check if in use
        const hasAllocations = rawAllocations.some((a) => a.time_off_type_id === id);
        const hasRequests = rawRequests.some((r) => r.time_off_type_id === id);

        if (hasAllocations || hasRequests) {
          reject(
            new Error(
              'Cannot delete this Time Off Type because it has associated allocations or requests. Deactivate it instead.'
            )
          );
          return;
        }

        const filtered = rawTypes.filter((t) => t.id !== id);
        employeeService._setRawTimeOffTypes(filtered);

        resolve({
          success: true,
          message: 'Time Off Type deleted successfully.',
        });
      }, 200);
    });
  },

  // ==========================================
  // 2. TIME OFF ALLOCATIONS MANAGEMENT
  // ==========================================

  getAllocations: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const endpoint = params.isSelfService || params.employeeId ? '/time-off/allocations/my' : '/time-off/allocations';
      const apiRes = await apiClient.get(endpoint, params);
      if (apiRes?.success && apiRes?.data) {
        const rawList = Array.isArray(apiRes.data) ? apiRes.data : apiRes.data.allocations || [];
        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const uiList = rawList.map((a) => timeOffAllocationAdapter.toUIModel(a, rawEmployees, rawTypes));
        return {
          data: uiList,
          metrics: {
            total: uiList.length,
            pending: uiList.filter((a) => a.status === 'pending').length,
            approved: uiList.filter((a) => a.status === 'approved').length,
            totalRemaining: Number(uiList.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0).toFixed(2)),
          },
          pagination: {
            page: apiRes.pagination?.page || params.page || 1,
            pageSize: apiRes.pagination?.limit || params.pageSize || 10,
            totalItems: apiRes.pagination?.total || uiList.length,
            totalPages: apiRes.pagination?.totalPages || Math.ceil(uiList.length / (params.pageSize || 10)) || 1,
          },
        };
      }
    } catch (err) {
      console.warn('[timeOffService] Live getAllocations failed, fallback to local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        let allocs = employeeService
          ._getRawTimeOffAllocations()
          .map((a) => timeOffAllocationAdapter.toUIModel(a, rawEmployees, rawTypes));

        // Employee filter (e.g., smart button query parameter ?employeeId=emp-001)
        if (params.employeeId) {
          allocs = allocs.filter((a) => a.employeeId === params.employeeId);
        }

        // Time Off Type filter
        if (params.timeOffTypeId) {
          allocs = allocs.filter((a) => a.timeOffTypeId === params.timeOffTypeId);
        }

        // Status filter (pending | approved | rejected)
        if (params.status) {
          allocs = allocs.filter((a) => a.status === params.status.toLowerCase());
        }

        // Search (Employee Name, Code, Leave Type Name)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          allocs = allocs.filter(
            (a) =>
              a.employee.name.toLowerCase().includes(q) ||
              a.employee.code.toLowerCase().includes(q) ||
              a.timeOffType.name.toLowerCase().includes(q) ||
              a.timeOffType.code.toLowerCase().includes(q)
          );
        }

        // Date Range Filters
        if (params.startDate) {
          allocs = allocs.filter((a) => a.startDate >= params.startDate);
        }
        if (params.endDate) {
          allocs = allocs.filter((a) => a.endDate <= params.endDate);
        }

        // Calculate Summary Metrics
        const allUIAllocs = employeeService
          ._getRawTimeOffAllocations()
          .map((a) => timeOffAllocationAdapter.toUIModel(a, rawEmployees, rawTypes));

        const pendingCount = allUIAllocs.filter((a) => a.status === 'pending').length;
        const approvedCount = allUIAllocs.filter((a) => a.status === 'approved').length;
        const totalRemaining = allUIAllocs
          .filter((a) => a.status === 'approved')
          .reduce((acc, curr) => acc + curr.remainingAmount, 0);

        const metrics = {
          total: allUIAllocs.length,
          pending: pendingCount,
          approved: approvedCount,
          totalRemaining: Number(totalRemaining.toFixed(2)),
        };

        // Sorting
        const sortBy = params.sortBy || 'createdAt';
        const sortDirection = params.sortDirection === 'asc' ? 1 : -1;
        allocs.sort((a, b) => {
          let valA = a[sortBy];
          let valB = b[sortBy];
          if (sortBy === 'employee') valA = a.employee.name;
          if (sortBy === 'employee') valB = b.employee.name;
          if (sortBy === 'timeOffType') valA = a.timeOffType.name;
          if (sortBy === 'timeOffType') valB = b.timeOffType.name;

          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const totalItems = allocs.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const paginatedData = allocs.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          data: paginatedData,
          metrics,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
          },
        });
      }, 200);
    });
  },

  getAllocationById: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const rawAlloc = rawAllocs.find((a) => a.id === id);
        if (!rawAlloc) {
          reject(new Error(`Allocation with ID ${id} not found.`));
          return;
        }

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const uiAlloc = timeOffAllocationAdapter.toUIModel(rawAlloc, rawEmployees, rawTypes);

        resolve({ data: uiAlloc });
      }, 150);
    });
  },

  createAllocation: async (allocData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const { employeeId, timeOffTypeId, startDate, endDate, allocatedAmount, status } = allocData;

        if (!employeeId) {
          reject(new Error('Please select an employee.'));
          return;
        }
        if (!timeOffTypeId) {
          reject(new Error('Please select a Time Off Type.'));
          return;
        }
        if (!startDate || !endDate) {
          reject(new Error('Start Date and End Date are required.'));
          return;
        }
        if (new Date(endDate) < new Date(startDate)) {
          reject(new Error('End Date cannot be earlier than Start Date.'));
          return;
        }
        if (!allocatedAmount || Number(allocatedAmount) <= 0) {
          reject(new Error('Allocated amount must be greater than zero.'));
          return;
        }

        const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
        const newId = `alloc-${Date.now()}`;

        const isApproved = status === 'approved';
        const apiPayload = {
          id: newId,
          employee_id: employeeId,
          time_off_type_id: timeOffTypeId,
          start_date: startDate,
          end_date: endDate,
          allocated_amount: Number(allocatedAmount),
          used_amount: 0,
          status: status || 'pending',
          approved_by: isApproved ? (allocData.approvedBy || 'HR Admin') : null,
          approved_at: isApproved ? new Date().toISOString() : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rawAllocs.unshift(apiPayload);
        employeeService._setRawTimeOffAllocations(rawAllocs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();

        resolve({
          success: true,
          data: timeOffAllocationAdapter.toUIModel(apiPayload, rawEmployees, rawTypes),
          message: 'Time Off Allocation created successfully.',
        });
      }, 250);
    });
  },

  updateAllocation: async (id, allocData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
        const index = rawAllocs.findIndex((a) => a.id === id);
        if (index === -1) {
          reject(new Error(`Allocation with ID ${id} not found.`));
          return;
        }

        const existing = rawAllocs[index];
        const { startDate, endDate, allocatedAmount } = allocData;

        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          reject(new Error('End Date cannot be earlier than Start Date.'));
          return;
        }

        if (allocatedAmount !== undefined && Number(allocatedAmount) < Number(existing.used_amount)) {
          reject(
            new Error(
              `Cannot reduce allocated amount below already used amount (${existing.used_amount}).`
            )
          );
          return;
        }

        const updated = {
          ...existing,
          start_date: startDate || existing.start_date,
          end_date: endDate || existing.end_date,
          allocated_amount: allocatedAmount !== undefined ? Number(allocatedAmount) : existing.allocated_amount,
          updated_at: new Date().toISOString(),
        };

        rawAllocs[index] = updated;
        employeeService._setRawTimeOffAllocations(rawAllocs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();

        resolve({
          success: true,
          data: timeOffAllocationAdapter.toUIModel(updated, rawEmployees, rawTypes),
          message: 'Allocation updated successfully.',
        });
      }, 250);
    });
  },

  approveAllocation: async (id, user = null) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
        const index = rawAllocs.findIndex((a) => a.id === id);
        if (index === -1) {
          reject(new Error(`Allocation with ID ${id} not found.`));
          return;
        }

        const approverName = user ? `${user.firstName || user.name || 'HR Manager'}` : 'HR Manager';

        const updated = {
          ...rawAllocs[index],
          status: 'approved',
          approved_by: approverName,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rawAllocs[index] = updated;
        employeeService._setRawTimeOffAllocations(rawAllocs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();

        resolve({
          success: true,
          data: timeOffAllocationAdapter.toUIModel(updated, rawEmployees, rawTypes),
          message: 'Allocation approved successfully.',
        });
      }, 200);
    });
  },

  rejectAllocation: async (id, user = null) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
        const index = rawAllocs.findIndex((a) => a.id === id);
        if (index === -1) {
          reject(new Error(`Allocation with ID ${id} not found.`));
          return;
        }

        const approverName = user ? `${user.firstName || user.name || 'HR Manager'}` : 'HR Manager';

        const updated = {
          ...rawAllocs[index],
          status: 'rejected',
          approved_by: approverName,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rawAllocs[index] = updated;
        employeeService._setRawTimeOffAllocations(rawAllocs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();

        resolve({
          success: true,
          data: timeOffAllocationAdapter.toUIModel(updated, rawEmployees, rawTypes),
          message: 'Allocation rejected.',
        });
      }, 200);
    });
  },

  deleteAllocation: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const rawRequests = employeeService._getRawTimeOffRequests();

        // Prevent deletion if requests reference it
        const hasRequests = rawRequests.some((r) => r.allocation_id === id);
        if (hasRequests) {
          reject(
            new Error('Cannot delete this allocation because Time Off requests are linked to it.')
          );
          return;
        }

        const filtered = rawAllocs.filter((a) => a.id !== id);
        employeeService._setRawTimeOffAllocations(filtered);

        resolve({ success: true, message: 'Allocation deleted successfully.' });
      }, 200);
    });
  },

  // ==========================================
  // 3. TIME OFF REQUESTS MANAGEMENT
  // ==========================================

  getTimeOffRequests: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const endpoint = params.isSelfService || params.employeeId ? '/time-off/requests/my' : '/time-off/requests';
      const apiRes = await apiClient.get(endpoint, params);
      if (apiRes?.success && apiRes?.data) {
        const rawList = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.requests || [];
        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const reqs = rawList.map((r) =>
          timeOffRequestAdapter.toUIModel(r, rawEmployees, rawTypes, rawAllocs)
        );

        const approvedDays = reqs
          .filter((r) => r.status === 'approved' && r.timeOffType?.unit === 'days')
          .reduce((sum, r) => sum + (r.duration || 0), 0);
        const approvedHours = reqs
          .filter((r) => r.status === 'approved' && r.timeOffType?.unit === 'hours')
          .reduce((sum, r) => sum + (r.duration || 0), 0);

        return {
          data: reqs,
          metrics: {
            total: reqs.length,
            pending: reqs.filter((r) => r.status === 'pending').length,
            approved: reqs.filter((r) => r.status === 'approved').length,
            rejected: reqs.filter((r) => r.status === 'rejected').length,
            approvedDays,
            approvedHours,
          },
          pagination: {
            page: apiRes.pagination?.page || params.page || 1,
            pageSize: apiRes.pagination?.limit || params.pageSize || 10,
            totalItems: apiRes.pagination?.total || reqs.length,
            totalPages:
              apiRes.pagination?.totalPages ||
              Math.ceil(reqs.length / (params.pageSize || 10)) ||
              1,
          },
        };
      }
    } catch (err) {
      console.warn('[timeOffService] Live getTimeOffRequests failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();

        let reqs = employeeService
          ._getRawTimeOffRequests()
          .map((r) => timeOffRequestAdapter.toUIModel(r, rawEmployees, rawTypes, rawAllocs));

        // Employee filter (?employeeId=emp-001)
        if (params.employeeId) {
          reqs = reqs.filter((r) => r.employeeId === params.employeeId);
        }

        // Department filter
        if (params.departmentId) {
          reqs = reqs.filter((r) => {
            const emp = rawEmployees.find((e) => e.id === r.employeeId);
            return emp && emp.department_id === params.departmentId;
          });
        }

        // Time Off Type filter
        if (params.timeOffTypeId) {
          reqs = reqs.filter((r) => r.timeOffTypeId === params.timeOffTypeId);
        }

        // Status filter
        if (params.status) {
          reqs = reqs.filter((r) => r.status === params.status.toLowerCase());
        }

        // Search (Employee Name, Code, Reason)
        if (params.search) {
          const q = params.search.toLowerCase().trim();
          reqs = reqs.filter(
            (r) =>
              r.employee.name.toLowerCase().includes(q) ||
              r.employee.code.toLowerCase().includes(q) ||
              r.reason.toLowerCase().includes(q) ||
              r.timeOffType.name.toLowerCase().includes(q)
          );
        }

        // Date Range Filters
        if (params.startDate) {
          reqs = reqs.filter((r) => r.startDate >= params.startDate);
        }
        if (params.endDate) {
          reqs = reqs.filter((r) => r.endDate <= params.endDate);
        }

        // Calculate Summary Metrics
        const scopedReqs = employeeService
          ._getRawTimeOffRequests()
          .map((r) => timeOffRequestAdapter.toUIModel(r, rawEmployees, rawTypes, rawAllocs));

        const metrics = {
          total: scopedReqs.length,
          pending: scopedReqs.filter((r) => r.status === 'pending').length,
          approved: scopedReqs.filter((r) => r.status === 'approved').length,
          rejected: scopedReqs.filter((r) => r.status === 'rejected').length,
          approvedDays: scopedReqs
            .filter((r) => r.status === 'approved' && r.timeOffType.unit === 'days')
            .reduce((sum, r) => sum + r.duration, 0),
          approvedHours: scopedReqs
            .filter((r) => r.status === 'approved' && r.timeOffType.unit === 'hours')
            .reduce((sum, r) => sum + r.duration, 0),
        };

        // Sorting
        const sortBy = params.sortBy || 'createdAt';
        const sortDirection = params.sortDirection === 'asc' ? 1 : -1;
        reqs.sort((a, b) => {
          let valA = a[sortBy];
          let valB = b[sortBy];
          if (sortBy === 'employee') valA = a.employee.name;
          if (sortBy === 'timeOffType') valA = a.timeOffType.name;

          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });

        // Pagination
        const page = parseInt(params.page, 10) || 1;
        const pageSize = parseInt(params.pageSize, 10) || 10;
        const totalItems = reqs.length;
        const totalPages = Math.ceil(totalItems / pageSize) || 1;
        const paginatedData = reqs.slice((page - 1) * pageSize, page * pageSize);

        resolve({
          data: paginatedData,
          metrics,
          pagination: {
            page,
            pageSize,
            totalItems,
            totalPages,
          },
        });
      }, 200);
    });
  },

  getTimeOffRequestById: async (id) => {
    try {
      const apiRes = await apiClient.get(`/time-off/requests/${id}`);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        return {
          data: timeOffRequestAdapter.toUIModel(apiRes.data, rawEmployees, rawTypes, rawAllocs),
        };
      }
    } catch (err) {
      console.warn(`[timeOffService] Live getTimeOffRequestById(${id}) failed, using fallback:`, err.message);
    }

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawReqs = employeeService._getRawTimeOffRequests();
        const rawReq = rawReqs.find((r) => r.id === id);
        if (!rawReq) {
          reject(new Error(`Time Off Request with ID ${id} not found.`));
          return;
        }

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const uiReq = timeOffRequestAdapter.toUIModel(rawReq, rawEmployees, rawTypes, rawAllocs);

        resolve({ data: uiReq });
      }, 150);
    });
  },

  createTimeOffRequest: async (requestData) => {
    // 1. Attempt live HTTP API call
    try {
      let durationVal =
        requestData.duration !== undefined && requestData.duration !== null && !isNaN(Number(requestData.duration))
          ? Number(requestData.duration)
          : null;

      if ((!durationVal || durationVal <= 0) && requestData.startDate && requestData.endDate) {
        const d1 = new Date(requestData.startDate);
        const d2 = new Date(requestData.endDate);
        const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
        if (diff > 0) durationVal = diff;
      }

      const payload = {
        employee_id: requestData.employeeId ? Number(requestData.employeeId) : undefined,
        time_off_type_id: Number(requestData.timeOffTypeId),
        start_date: requestData.startDate,
        end_date: requestData.endDate,
        duration: durationVal !== null && durationVal > 0 ? durationVal : 1,
        reason: requestData.reason || '',
      };
      const apiRes = await apiClient.post('/time-off/requests', payload);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        return {
          success: true,
          data: timeOffRequestAdapter.toUIModel(apiRes.data, rawEmployees, rawTypes, rawAllocs),
          message: apiRes.message || 'Leave request submitted successfully.',
        };
      }
    } catch (err) {
      const errorMsg =
        (Array.isArray(err.data?.errors)
          ? err.data.errors.map((e) => (typeof e === 'string' ? e : e.message || e.field)).join(', ')
          : null) ||
        (Array.isArray(err.response?.data?.errors)
          ? err.response.data.errors.map((e) => (typeof e === 'string' ? e : e.message || e.field)).join(', ')
          : null) ||
        err.data?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to create leave request.';
      throw new Error(errorMsg);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const { employeeId, timeOffTypeId, allocationId, startDate, endDate, customHours, reason } =
          requestData;

        if (!employeeId) {
          reject(new Error('Please select an employee.'));
          return;
        }
        if (!timeOffTypeId) {
          reject(new Error('Please select a Time Off Type.'));
          return;
        }
        if (!startDate || !endDate) {
          reject(new Error('Start Date and End Date are required.'));
          return;
        }
        if (new Date(endDate) < new Date(startDate)) {
          reject(new Error('End Date cannot be earlier than Start Date.'));
          return;
        }

        // Fetch Type & check active status
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawType = rawTypes.find((t) => t.id === timeOffTypeId);
        if (!rawType || !rawType.is_active) {
          reject(new Error('Selected Time Off Type is inactive and cannot be requested.'));
          return;
        }

        // Compute duration
        const duration = calculateRequestDuration(startDate, endDate, rawType.unit, customHours);
        if (duration <= 0) {
          reject(new Error('Invalid duration for the selected date range.'));
          return;
        }

        const rawAllocs = [...employeeService._getRawTimeOffAllocations()];

        // If allocation required, validate linked allocation & balance
        let targetAlloc = null;
        if (rawType.requires_allocation) {
          if (!allocationId) {
            reject(new Error('An allocation selection is required for this leave type.'));
            return;
          }
          targetAlloc = rawAllocs.find((a) => a.id === allocationId);
          if (!targetAlloc || targetAlloc.status !== 'approved') {
            reject(new Error('Selected allocation is invalid or not approved.'));
            return;
          }

          const remaining = calculateRemainingBalance(
            targetAlloc.allocated_amount,
            targetAlloc.used_amount
          );
          if (duration > remaining) {
            reject(
              new Error(
                `Insufficient leave balance for this request. Requested: ${duration} ${rawType.unit}, Remaining: ${remaining} ${rawType.unit}`
              )
            );
            return;
          }
        }

        // Determine if approval is required
        const requiresApproval = rawType.requires_approval;
        const initialStatus = requiresApproval ? 'pending' : 'approved';

        const newId = `req-${Date.now()}`;
        const newReqPayload = {
          id: newId,
          employee_id: employeeId,
          time_off_type_id: timeOffTypeId,
          allocation_id: allocationId || null,
          start_date: startDate,
          end_date: endDate,
          duration,
          reason: reason ? reason.trim() : '',
          status: initialStatus,
          approved_by: !requiresApproval ? 'System Auto-Approval' : null,
          approved_at: !requiresApproval ? new Date().toISOString() : null,
          rejected_reason: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // If auto-approved and requires allocation, consume balance immediately
        if (initialStatus === 'approved' && targetAlloc) {
          const allocIndex = rawAllocs.findIndex((a) => a.id === targetAlloc.id);
          if (allocIndex !== -1) {
            rawAllocs[allocIndex] = {
              ...rawAllocs[allocIndex],
              used_amount: Number(rawAllocs[allocIndex].used_amount) + duration,
              updated_at: new Date().toISOString(),
            };
            employeeService._setRawTimeOffAllocations(rawAllocs);
          }
        }

        const rawReqs = [...employeeService._getRawTimeOffRequests()];
        rawReqs.unshift(newReqPayload);
        employeeService._setRawTimeOffRequests(rawReqs);

        const rawEmployees = employeeService._getRawEmployees();
        const uiReq = timeOffRequestAdapter.toUIModel(newReqPayload, rawEmployees, rawTypes, rawAllocs);

        resolve({
          success: true,
          data: uiReq,
          message:
            initialStatus === 'approved'
              ? 'Time Off request submitted and auto-approved.'
              : 'Time Off request submitted successfully.',
        });
      }, 250);
    });
  },

  updateTimeOffRequest: async (id, requestData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawReqs = [...employeeService._getRawTimeOffRequests()];
        const reqIndex = rawReqs.findIndex((r) => String(r.id) === String(id));
        if (reqIndex === -1) {
          reject(new Error(`Request with ID ${id} not found.`));
          return;
        }

        const existingReq = rawReqs[reqIndex];
        const { startDate, endDate, customHours, reason } = requestData;

        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawType = rawTypes.find((t) => t.id === existingReq.time_off_type_id);

        const newStartDate = startDate || existingReq.start_date;
        const newEndDate = endDate || existingReq.end_date;

        if (new Date(newEndDate) < new Date(newStartDate)) {
          reject(new Error('End Date cannot be earlier than Start Date.'));
          return;
        }

        const newDuration = calculateRequestDuration(
          newStartDate,
          newEndDate,
          rawType ? rawType.unit : 'days',
          customHours
        );

        // If request is already approved, adjust allocation balance delta
        if (existingReq.status === 'approved' && existingReq.allocation_id) {
          const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
          const allocIndex = rawAllocs.findIndex((a) => a.id === existingReq.allocation_id);

          if (allocIndex !== -1) {
            const alloc = rawAllocs[allocIndex];
            const oldDuration = Number(existingReq.duration);
            const durationDelta = newDuration - oldDuration;

            const remaining = calculateRemainingBalance(alloc.allocated_amount, alloc.used_amount);
            if (durationDelta > remaining) {
              reject(
                new Error(
                  `Insufficient remaining balance to increase duration by ${durationDelta}. Remaining: ${remaining}`
                )
              );
              return;
            }

            rawAllocs[allocIndex] = {
              ...alloc,
              used_amount: Number(alloc.used_amount) + durationDelta,
              updated_at: new Date().toISOString(),
            };
            employeeService._setRawTimeOffAllocations(rawAllocs);
          }
        }

        const updatedReq = {
          ...existingReq,
          start_date: newStartDate,
          end_date: newEndDate,
          duration: newDuration,
          reason: reason !== undefined ? reason.trim() : existingReq.reason,
          updated_at: new Date().toISOString(),
        };

        rawReqs[reqIndex] = updatedReq;
        employeeService._setRawTimeOffRequests(rawReqs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const uiReq = timeOffRequestAdapter.toUIModel(updatedReq, rawEmployees, rawTypes, rawAllocs);

        resolve({
          success: true,
          data: uiReq,
          message: 'Time Off Request updated successfully.',
        });
      }, 250);
    });
  },

  approveTimeOffRequest: async (id, user = null) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.patch(`/time-off/requests/${id}/approve`);
      if (apiRes?.success) {
        return {
          success: true,
          data: apiRes.data,
          message: apiRes.message || 'Time Off request approved and balance updated successfully.',
        };
      }
    } catch (err) {
      console.warn(`[timeOffService] Live approveTimeOffRequest(${id}) notice:`, err.message);
      if (err.status && err.status !== 404) {
        throw err;
      }
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawReqs = [...employeeService._getRawTimeOffRequests()];
        const reqIndex = rawReqs.findIndex((r) => String(r.id) === String(id));
        if (reqIndex === -1) {
          reject(new Error(`Request with ID ${id} not found.`));
          return;
        }

        const existingReq = rawReqs[reqIndex];

        // PREVENT DOUBLE CONSUMPTION
        if (existingReq.status === 'approved') {
          reject(new Error('This request has already been approved. Balance was consumed.'));
          return;
        }

        const approverName = user ? `${user.firstName || user.name || 'HR Manager'}` : 'HR Manager';

        // Update linked allocation if present
        if (existingReq.allocation_id) {
          const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
          const allocIndex = rawAllocs.findIndex((a) => String(a.id) === String(existingReq.allocation_id));

          if (allocIndex !== -1) {
            const alloc = rawAllocs[allocIndex];
            const duration = Number(existingReq.duration);
            const remaining = calculateRemainingBalance(alloc.allocated_amount, alloc.used_amount);

            if (duration > remaining) {
              reject(
                new Error(
                  `Cannot approve request. Insufficient allocation balance (Requested: ${duration}, Remaining: ${remaining}).`
                )
              );
              return;
            }

            // Deduct balance
            rawAllocs[allocIndex] = {
              ...alloc,
              used_amount: Number(alloc.used_amount) + duration,
              updated_at: new Date().toISOString(),
            };
            employeeService._setRawTimeOffAllocations(rawAllocs);
          }
        }

        const updatedReq = {
          ...existingReq,
          status: 'approved',
          approved_by: approverName,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        rawReqs[reqIndex] = updatedReq;
        employeeService._setRawTimeOffRequests(rawReqs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const uiReq = timeOffRequestAdapter.toUIModel(updatedReq, rawEmployees, rawTypes, rawAllocs);

        resolve({
          success: true,
          data: uiReq,
          message: 'Time Off request approved and balance updated successfully.',
        });
      }, 200);
    });
  },

  rejectTimeOffRequest: async (id, user = null, reason = '') => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.patch(`/time-off/requests/${id}/reject`, {
        rejected_reason: reason || 'Rejected by HR Manager',
      });
      if (apiRes?.success) {
        return {
          success: true,
          data: apiRes.data,
          message: apiRes.message || 'Time Off request rejected.',
        };
      }
    } catch (err) {
      console.warn(`[timeOffService] Live rejectTimeOffRequest(${id}) notice:`, err.message);
      if (err.status && err.status !== 404) {
        throw err;
      }
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!reason || !reason.trim()) {
          reject(new Error('A rejection reason is required before rejecting a request.'));
          return;
        }

        const rawReqs = [...employeeService._getRawTimeOffRequests()];
        const reqIndex = rawReqs.findIndex((r) => String(r.id) === String(id));
        if (reqIndex === -1) {
          reject(new Error(`Request with ID ${id} not found.`));
          return;
        }

        const existingReq = rawReqs[reqIndex];
        const approverName = user ? `${user.firstName || user.name || 'HR Manager'}` : 'HR Manager';

        // If request was previously approved, restore the consumed allocation balance
        if (existingReq.status === 'approved' && existingReq.allocation_id) {
          const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
          const allocIndex = rawAllocs.findIndex((a) => String(a.id) === String(existingReq.allocation_id));
          if (allocIndex !== -1) {
            const alloc = rawAllocs[allocIndex];
            rawAllocs[allocIndex] = {
              ...alloc,
              used_amount: Math.max(0, Number(alloc.used_amount) - Number(existingReq.duration)),
              updated_at: new Date().toISOString(),
            };
            employeeService._setRawTimeOffAllocations(rawAllocs);
          }
        }

        const updatedReq = {
          ...existingReq,
          status: 'rejected',
          approved_by: approverName,
          approved_at: new Date().toISOString(),
          rejected_reason: reason.trim(),
          updated_at: new Date().toISOString(),
        };

        rawReqs[reqIndex] = updatedReq;
        employeeService._setRawTimeOffRequests(rawReqs);

        const rawEmployees = employeeService._getRawEmployees();
        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();
        const uiReq = timeOffRequestAdapter.toUIModel(updatedReq, rawEmployees, rawTypes, rawAllocs);

        resolve({
          success: true,
          data: uiReq,
          message: 'Time Off request rejected.',
        });
      }, 200);
    });
  },

  cancelTimeOffRequest: async (id, user = null) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.patch(`/time-off/requests/${id}/cancel`);
      if (apiRes?.success) {
        return {
          success: true,
          data: apiRes.data,
          message: apiRes.message || 'Time Off request cancelled.',
        };
      }
    } catch (err) {
      console.warn(`[timeOffService] Live cancelTimeOffRequest(${id}) notice:`, err.message);
      if (err.status && err.status !== 404) {
        throw err;
      }
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawReqs = [...employeeService._getRawTimeOffRequests()];
        const reqIndex = rawReqs.findIndex((r) => String(r.id) === String(id));
        if (reqIndex === -1) {
          reject(new Error(`Request with ID ${id} not found.`));
          return;
        }

        const existingReq = rawReqs[reqIndex];
        const updatedReq = {
          ...existingReq,
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        };

        rawReqs[reqIndex] = updatedReq;
        employeeService._setRawTimeOffRequests(rawReqs);

        resolve({ success: true, data: updatedReq, message: 'Time Off request cancelled.' });
      }, 150);
    });
  },

  deleteTimeOffRequest: async (id) => {
    // 1. Attempt live HTTP REST API call (cancel request on backend)
    try {
      await apiClient.patch(`/time-off/requests/${id}/cancel`).catch(() => {});
    } catch (err) {
      // ignore
    }

    // 2. Local store cleanup
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawReqs = employeeService._getRawTimeOffRequests();
        const target = rawReqs.find((r) => String(r.id) === String(id));

        if (target && target.status === 'approved' && target.allocation_id) {
          // Restore allocation balance
          const rawAllocs = [...employeeService._getRawTimeOffAllocations()];
          const allocIndex = rawAllocs.findIndex((a) => String(a.id) === String(target.allocation_id));
          if (allocIndex !== -1) {
            const alloc = rawAllocs[allocIndex];
            rawAllocs[allocIndex] = {
              ...alloc,
              used_amount: Math.max(0, Number(alloc.used_amount) - Number(target.duration)),
              updated_at: new Date().toISOString(),
            };
            employeeService._setRawTimeOffAllocations(rawAllocs);
          }
        }

        const filtered = rawReqs.filter((r) => String(r.id) !== String(id));
        employeeService._setRawTimeOffRequests(filtered);

        resolve({ success: true, message: 'Time Off request deleted successfully.' });
      }, 150);
    });
  },

  // ==========================================
  // 4. EMPLOYEE LEAVE BALANCES AGGREGATOR
  // ==========================================

  getEmployeeLeaveBalances: async (employeeId) => {
    // 1. Attempt live HTTP API call
    try {
      const endpoint = employeeId && !isNaN(Number(employeeId)) ? `/time-off/balance/${employeeId}` : '/time-off/balance';
      const apiRes = await apiClient.get(endpoint);
      if (apiRes?.success && apiRes?.data) {
        const rawBalances = apiRes.data.balances || apiRes.data;
        if (Array.isArray(rawBalances)) {
          return {
            data: rawBalances.map((b) => ({
              timeOffTypeId: b.time_off_type_id || b.timeOffTypeId || b.id,
              timeOffTypeName: b.name || b.timeOffTypeName,
              code: b.code,
              unit: b.unit,
              allocated: Number(b.allocated_amount ?? b.allocated ?? 0),
              used: Number(b.used_amount ?? b.used ?? 0),
              remaining: Number(b.available ?? b.remaining ?? 0),
            })),
          };
        }
      }
    } catch (err) {
      console.warn('[timeOffService] Live getEmployeeLeaveBalances failed, using fallback:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!employeeId) {
          resolve({ data: [] });
          return;
        }

        const rawTypes = employeeService._getRawTimeOffTypes();
        const rawAllocs = employeeService._getRawTimeOffAllocations();

        // Get approved allocations for this employee
        const empAllocs = rawAllocs.filter(
          (a) => a.employee_id === employeeId && a.status === 'approved'
        );

        // Group by Time Off Type
        const balanceMap = {};

        empAllocs.forEach((alloc) => {
          const type = rawTypes.find((t) => t.id === alloc.time_off_type_id);
          if (!type) return;

          if (!balanceMap[type.id]) {
            balanceMap[type.id] = {
              timeOffTypeId: type.id,
              timeOffTypeName: type.name,
              code: type.code,
              unit: type.unit,
              allocated: 0,
              used: 0,
              remaining: 0,
            };
          }

          const allocated = Number(alloc.allocated_amount || 0);
          const used = Number(alloc.used_amount || 0);

          balanceMap[type.id].allocated += allocated;
          balanceMap[type.id].used += used;
          balanceMap[type.id].remaining = calculateRemainingBalance(
            balanceMap[type.id].allocated,
            balanceMap[type.id].used
          );
        });

        resolve({ data: Object.values(balanceMap) });
      }, 150);
    });
  },
};
