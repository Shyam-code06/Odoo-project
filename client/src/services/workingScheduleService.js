import { employeeService } from './employeeService';
import { workingScheduleAdapter } from '../adapters/workingScheduleAdapter';
import { validateDaySchedule } from '../utils/scheduleCalculator';

export const workingScheduleService = {
  getWorkingSchedules: async (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const rawEmployees = employeeService._getRawEmployees();

        let list = rawSchedules.map((s) =>
          workingScheduleAdapter.toUIModel(s, rawEmployees)
        );

        // Search filter (name, description, timezone)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              s.description.toLowerCase().includes(q) ||
              s.timezone.toLowerCase().includes(q)
          );
        }

        // Status filter
        if (params.status) {
          list = list.filter(
            (s) => s.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        // Timezone filter
        if (params.timezone) {
          list = list.filter(
            (s) => s.timezone.toLowerCase() === params.timezone.toLowerCase()
          );
        }

        // Summary metrics
        const totalSchedules = rawSchedules.length;
        const activeSchedules = rawSchedules.filter((s) => (s.status || 'Active') === 'Active').length;
        const inactiveSchedules = rawSchedules.filter((s) => s.status === 'Inactive').length;
        const totalAssignedEmployees = rawEmployees.filter((e) => e.working_schedule_id).length;

        // Sorting
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

        // Pagination
        const total = list.length;
        const page = params.page || 1;
        const pageSize = params.pageSize || 10;
        const startIndex = (page - 1) * pageSize;
        const paginated = list.slice(startIndex, startIndex + pageSize);

        resolve({
          data: paginated,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          summary: {
            totalSchedules,
            activeSchedules,
            inactiveSchedules,
            totalAssignedEmployees,
          },
        });
      }, 200);
    });
  },

  getWorkingScheduleById: async (id) => {
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const apiData = workingScheduleAdapter.toAPIModel(formData);

        if (!apiData.name) {
          reject(new Error('Schedule name is required.'));
          return;
        }

        if (!apiData.timezone) {
          reject(new Error('Timezone is required.'));
          return;
        }

        // Validate individual day schedules
        for (const day of apiData.days) {
          const err = validateDaySchedule(day.startTime, day.endTime, day.breakMinutes, day.isWorkingDay);
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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const idx = rawSchedules.findIndex((s) => s.id === id);
        if (idx === -1) {
          reject(new Error('Working schedule not found.'));
          return;
        }

        const apiData = workingScheduleAdapter.toAPIModel(formData);

        if (!apiData.name) {
          reject(new Error('Schedule name is required.'));
          return;
        }

        if (!apiData.timezone) {
          reject(new Error('Timezone is required.'));
          return;
        }

        for (const day of apiData.days) {
          const err = validateDaySchedule(day.startTime, day.endTime, day.breakMinutes, day.isWorkingDay);
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

  toggleScheduleStatus: async (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const idx = rawSchedules.findIndex((s) => s.id === id);
        if (idx === -1) {
          reject(new Error('Working schedule not found.'));
          return;
        }

        const currentStatus = rawSchedules[idx].status || 'Active';
        const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';

        rawSchedules[idx].status = nextStatus;
        rawSchedules[idx].updated_at = new Date().toISOString();

        employeeService._setRawSchedules([...rawSchedules]);

        const rawEmployees = employeeService._getRawEmployees();
        resolve({
          success: true,
          schedule: workingScheduleAdapter.toUIModel(rawSchedules[idx], rawEmployees),
        });
      }, 200);
    });
  },

  deleteWorkingSchedule: async (id) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const filtered = rawSchedules.filter((s) => s.id !== id);
        employeeService._setRawSchedules(filtered);
        resolve({ success: true });
      }, 200);
    });
  },

  getScheduleOptions: async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawSchedules = employeeService._getRawSchedules();
        const rawEmployees = employeeService._getRawEmployees();
        resolve(
          rawSchedules.map((s) => {
            const uiModel = workingScheduleAdapter.toUIModel(s, rawEmployees);
            return {
              id: s.id,
              name: `${s.name} (${uiModel.totalWeeklyShort} / wk)`,
              timezone: s.timezone,
              status: s.status || 'Active',
            };
          })
        );
      }, 100);
    });
  },
};
