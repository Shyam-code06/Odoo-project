import { employeeService } from './employeeService';
import { workingScheduleAdapter } from '../adapters/workingScheduleAdapter';
import { validateDaySchedule } from '../utils/scheduleCalculator';
import { apiClient } from './apiClient';

export const workingScheduleService = {
  getWorkingSchedules: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.get('/schedules', params);
      if (apiRes?.success && apiRes?.data) {
        const rawSchedules = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.schedules || [];
        const rawEmployees = employeeService._getRawEmployees();

        const uiList = rawSchedules.map((s) =>
          workingScheduleAdapter.toUIModel(s, rawEmployees)
        );

        const totalSchedules = uiList.length;
        const activeSchedules = uiList.filter(
          (s) => (s.status || 'Active') === 'Active'
        ).length;
        const inactiveSchedules = totalSchedules - activeSchedules;
        const totalAssignedEmployees = rawEmployees.filter(
          (e) => e.working_schedule_id
        ).length;

        return {
          data: uiList,
          metrics: {
            totalSchedules,
            activeSchedules,
            inactiveSchedules,
            totalAssignedEmployees,
          },
          total: apiRes.pagination?.total || uiList.length,
          page: apiRes.pagination?.page || params.page || 1,
          pageSize: apiRes.pagination?.limit || params.pageSize || 10,
          totalPages:
            apiRes.pagination?.totalPages ||
            Math.ceil(uiList.length / (params.pageSize || 10)) ||
            1,
        };
      }
    } catch (err) {
      console.warn('[workingScheduleService] Live getWorkingSchedules failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const rawEmployees = employeeService._getRawEmployees();

        let list = rawSchedules.map((s) =>
          workingScheduleAdapter.toUIModel(s, rawEmployees)
        );

        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.description.toLowerCase().includes(q) ||
              s.timezone.toLowerCase().includes(q)
          );
        }

        if (params.status) {
          list = list.filter(
            (s) => s.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        if (params.timezone) {
          list = list.filter(
            (s) => s.timezone.toLowerCase() === params.timezone.toLowerCase()
          );
        }

        const totalSchedules = rawSchedules.length;
        const activeSchedules = rawSchedules.filter(
          (s) => (s.status || 'Active') === 'Active'
        ).length;
        const inactiveSchedules = rawSchedules.filter(
          (s) => s.status === 'Inactive'
        ).length;
        const totalAssignedEmployees = rawEmployees.filter(
          (e) => e.working_schedule_id
        ).length;

        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          list.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (valA < valB) return -1 * dir;
            if (valA > valB) return 1 * dir;
            return 0;
          });
        }

        const total = list.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const paginated = list.slice(startIndex, startIndex + pageSize);

        resolve({
          data: paginated,
          metrics: {
            totalSchedules,
            activeSchedules,
            inactiveSchedules,
            totalAssignedEmployees,
          },
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
        });
      }, 200);
    });
  },

  getWorkingScheduleById: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.get(`/schedules/${id}`);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        return workingScheduleAdapter.toUIModel(apiRes.data, rawEmployees);
      }
    } catch (err) {
      console.warn(`[workingScheduleService] Live getWorkingScheduleById(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const rawEmployees = employeeService._getRawEmployees();

        const sched = rawSchedules.find((s) => s.id === id);
        if (!sched) {
          resolve(null);
          return;
        }

        resolve(workingScheduleAdapter.toUIModel(sched, rawEmployees));
      }, 150);
    });
  },

  createWorkingSchedule: async (formData) => {
    const apiData = workingScheduleAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.post('/schedules', apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        return {
          success: true,
          schedule: workingScheduleAdapter.toUIModel(apiRes.data, rawEmployees),
        };
      }
    } catch (err) {
      console.warn('[workingScheduleService] Live createWorkingSchedule failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();

        if (!apiData.name) {
          reject(new Error('Schedule name is required.'));
          return;
        }

        if (!apiData.timezone) {
          reject(new Error('Timezone is required.'));
          return;
        }

        for (const day of apiData.days || []) {
          const err = validateDaySchedule(
            day.startTime,
            day.endTime,
            day.breakMinutes,
            day.isWorkingDay
          );
          if (err) {
            reject(new Error(`${day.dayOfWeek}: ${err}`));
            return;
          }
        }

        const newSched = {
          id: `sched-${String(rawSchedules.length + 1).padStart(3, '0')}`,
          name: apiData.name,
          description: apiData.description,
          timezone: apiData.timezone,
          status: apiData.status,
          days: apiData.days,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updatedSchedules = [newSched, ...rawSchedules];
        employeeService._setRawSchedules(updatedSchedules);

        const rawEmployees = employeeService._getRawEmployees();

        resolve({
          success: true,
          schedule: workingScheduleAdapter.toUIModel(newSched, rawEmployees),
        });
      }, 250);
    });
  },

  updateWorkingSchedule: async (id, formData) => {
    const apiData = workingScheduleAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.put(`/schedules/${id}`, apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        return {
          success: true,
          schedule: workingScheduleAdapter.toUIModel(apiRes.data, rawEmployees),
        };
      }
    } catch (err) {
      console.warn(`[workingScheduleService] Live updateWorkingSchedule(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const idx = rawSchedules.findIndex((s) => s.id === id);
        if (idx === -1) {
          reject(new Error('Working schedule not found.'));
          return;
        }

        if (!apiData.name) {
          reject(new Error('Schedule name is required.'));
          return;
        }

        if (!apiData.timezone) {
          reject(new Error('Timezone is required.'));
          return;
        }

        for (const day of apiData.days || []) {
          const err = validateDaySchedule(
            day.startTime,
            day.endTime,
            day.breakMinutes,
            day.isWorkingDay
          );
          if (err) {
            reject(new Error(`${day.dayOfWeek}: ${err}`));
            return;
          }
        }

        const updated = {
          ...rawSchedules[idx],
          name: apiData.name,
          description: apiData.description,
          timezone: apiData.timezone,
          status: apiData.status,
          days: apiData.days,
          updated_at: new Date().toISOString(),
        };

        rawSchedules[idx] = updated;
        employeeService._setRawSchedules([...rawSchedules]);

        const rawEmployees = employeeService._getRawEmployees();

        resolve({
          success: true,
          schedule: workingScheduleAdapter.toUIModel(updated, rawEmployees),
        });
      }, 250);
    });
  },

  deleteWorkingSchedule: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.delete(`/schedules/${id}`);
      if (apiRes?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn(`[workingScheduleService] Live deleteWorkingSchedule(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const filtered = rawSchedules.filter((s) => s.id !== id);
        employeeService._setRawSchedules(filtered);
        resolve({ success: true });
      }, 200);
    });
  },
};

export default workingScheduleService;
