import { employeeService } from './employeeService';
import { attendanceAdapter } from '../adapters/attendanceAdapter';
import { calculateWorkedMinutes, deriveAttendanceStatus } from '../utils/attendanceCalculator';
import { apiClient } from './apiClient';

export const attendanceService = {
  getAttendanceRecords: async (params = {}) => {
    // 1. Attempt live HTTP REST API call via apiClient
    try {
      const apiRes = await apiClient.get('/attendance', params);
      if (apiRes?.success && apiRes?.data) {
        const rawAtt = Array.isArray(apiRes.data)
          ? apiRes.data
          : apiRes.data.attendance || [];
        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();

        const list = rawAtt.map((a) =>
          attendanceAdapter.toUIModel(a, rawEmployees, rawDepts, rawPositions, rawSchedules)
        );

        const totalRecords = list.length;
        const presentCount = list.filter((a) => a.status === 'Present').length;
        const lateCount = list.filter((a) => a.status === 'Late').length;
        const absentCount = list.filter((a) => a.status === 'Absent').length;
        const missingCheckOutCount = list.filter((a) => a.status === 'Incomplete').length;
        const correctedCount = list.filter((a) => a.isCorrected).length;

        return {
          data: list,
          total: apiRes.pagination?.total || totalRecords,
          page: apiRes.pagination?.page || params.page || 1,
          pageSize: apiRes.pagination?.limit || params.pageSize || 10,
          totalPages:
            apiRes.pagination?.totalPages ||
            Math.ceil(totalRecords / (params.pageSize || 10)) ||
            1,
          summary: {
            totalRecords,
            presentCount,
            lateCount,
            absentCount,
            missingCheckOutCount,
            correctedCount,
          },
        };
      }
    } catch (err) {
      console.warn('[attendanceService] Live getAttendanceRecords failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawAtt = employeeService._getRawAttendance();
        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();

        let list = rawAtt.map((a) =>
          attendanceAdapter.toUIModel(a, rawEmployees, rawDepts, rawPositions, rawSchedules)
        );

        if (params.restrictEmployeeId) {
          list = list.filter((a) => a.employeeId === params.restrictEmployeeId);
        } else if (params.employeeId || params.employee_id) {
          const empId = params.employeeId || params.employee_id;
          list = list.filter((a) => a.employeeId === empId);
        }

        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (a) =>
              (a.employee && a.employee.name.toLowerCase().includes(q)) ||
              (a.employee && a.employee.code.toLowerCase().includes(q))
          );
        }

        if (params.departmentId || params.department_id) {
          const deptId = params.departmentId || params.department_id;
          list = list.filter((a) => a.employee && a.employee.departmentId === deptId);
        }

        if (params.workingScheduleId || params.working_schedule_id) {
          const schedId = params.workingScheduleId || params.working_schedule_id;
          list = list.filter((a) => a.employee && a.employee.workingScheduleId === schedId);
        }

        if (params.status) {
          list = list.filter(
            (a) => a.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        if (params.date) {
          list = list.filter((a) => a.attendanceDate === params.date);
        } else {
          if (params.startDate) {
            list = list.filter((a) => a.attendanceDate >= params.startDate);
          }
          if (params.endDate) {
            list = list.filter((a) => a.attendanceDate <= params.endDate);
          }
        }

        const totalRecords = list.length;
        const presentCount = list.filter((a) => a.status === 'Present').length;
        const lateCount = list.filter((a) => a.status === 'Late').length;
        const absentCount = list.filter((a) => a.status === 'Absent').length;
        const missingCheckOutCount = list.filter((a) => a.status === 'Incomplete').length;
        const correctedCount = list.filter((a) => a.isCorrected).length;

        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          list.sort((a, b) => {
            let valA = a[key] || '';
            let valB = b[key] || '';
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
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize) || 1,
          summary: {
            totalRecords,
            presentCount,
            lateCount,
            absentCount,
            missingCheckOutCount,
            correctedCount,
          },
        });
      }, 200);
    });
  },

  getAttendanceById: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.get(`/attendance/${id}`);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();
        return attendanceAdapter.toUIModel(apiRes.data, rawEmployees, rawDepts, rawPositions, rawSchedules);
      }
    } catch (err) {
      console.warn(`[attendanceService] Live getAttendanceById(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawAtt = employeeService._getRawAttendance();
        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();

        const record = rawAtt.find((a) => a.id === id);
        if (!record) {
          resolve(null);
          return;
        }

        resolve(
          attendanceAdapter.toUIModel(record, rawEmployees, rawDepts, rawPositions, rawSchedules)
        );
      }, 150);
    });
  },

  checkDuplicateAttendance: (employeeId, attendanceDate, excludeId = null) => {
    const rawAtt = employeeService._getRawAttendance();
    return rawAtt.some(
      (a) => a.employee_id === employeeId && a.attendance_date === attendanceDate && a.id !== excludeId
    );
  },

  createAttendance: async (formData) => {
    const apiData = attendanceAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.post('/attendance', apiData);
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();
        return {
          success: true,
          record: attendanceAdapter.toUIModel(apiRes.data, rawEmployees, rawDepts, rawPositions, rawSchedules),
        };
      }
    } catch (err) {
      console.warn('[attendanceService] Live createAttendance failed, using local store:', err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAtt = employeeService._getRawAttendance();

        if (!apiData.employee_id) {
          reject(new Error('Employee selection is required.'));
          return;
        }

        if (!apiData.attendance_date) {
          reject(new Error('Attendance date is required.'));
          return;
        }

        if (attendanceService.checkDuplicateAttendance(apiData.employee_id, apiData.attendance_date)) {
          reject(new Error(`An attendance record already exists for this employee on ${apiData.attendance_date}.`));
          return;
        }

        if (apiData.check_in && apiData.check_out) {
          const start = new Date(apiData.check_in).getTime();
          const end = new Date(apiData.check_out).getTime();
          if (end <= start) {
            reject(new Error('Check-out time must be later than check-in time.'));
            return;
          }
        }

        const newRec = {
          id: `att-${String(rawAtt.length + 1).padStart(3, '0')}`,
          employee_id: apiData.employee_id,
          attendance_date: apiData.attendance_date,
          check_in: apiData.check_in,
          check_out: apiData.check_out,
          worked_minutes: apiData.worked_minutes,
          status: apiData.status,
          corrected_by: apiData.corrected_by,
          correction_reason: apiData.correction_reason,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const updated = [newRec, ...rawAtt];
        employeeService._setRawAttendance(updated);

        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();

        resolve({
          success: true,
          record: attendanceAdapter.toUIModel(newRec, rawEmployees, rawDepts, rawPositions, rawSchedules),
        });
      }, 250);
    });
  },

  correctAttendance: async (id, formData, correctedByUser = 'HR Manager') => {
    const apiData = attendanceAdapter.toAPIModel(formData);

    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.put(`/attendance/${id}`, {
        ...apiData,
        correction_reason: formData.correctionReason,
        corrected_by: correctedByUser,
      });
      if (apiRes?.success && apiRes?.data) {
        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();
        return {
          success: true,
          record: attendanceAdapter.toUIModel(apiRes.data, rawEmployees, rawDepts, rawPositions, rawSchedules),
        };
      }
    } catch (err) {
      console.warn(`[attendanceService] Live correctAttendance(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAtt = employeeService._getRawAttendance();
        const idx = rawAtt.findIndex((a) => a.id === id);
        if (idx === -1) {
          reject(new Error('Attendance record not found.'));
          return;
        }

        if (!formData.correctionReason || !formData.correctionReason.trim()) {
          reject(new Error('Correction reason is required for manual edits.'));
          return;
        }

        if (apiData.check_in && apiData.check_out) {
          const start = new Date(apiData.check_in).getTime();
          const end = new Date(apiData.check_out).getTime();
          if (end <= start) {
            reject(new Error('Check-out time must be later than check-in time.'));
            return;
          }
        }

        const updatedRec = {
          ...rawAtt[idx],
          check_in: apiData.check_in,
          check_out: apiData.check_out,
          worked_minutes: apiData.worked_minutes,
          status: apiData.status || rawAtt[idx].status,
          corrected_by: correctedByUser,
          correction_reason: formData.correctionReason.trim(),
          updated_at: new Date().toISOString(),
        };

        rawAtt[idx] = updatedRec;
        employeeService._setRawAttendance([...rawAtt]);

        const rawEmployees = employeeService._getRawEmployees();
        const rawDepts = employeeService._getRawDepartments();
        const rawPositions = employeeService._getRawJobPositions();
        const rawSchedules = employeeService._getRawSchedules();

        resolve({
          success: true,
          record: attendanceAdapter.toUIModel(updatedRec, rawEmployees, rawDepts, rawPositions, rawSchedules),
        });
      }, 250);
    });
  },

  deleteAttendance: async (id) => {
    // 1. Attempt live HTTP call
    try {
      const apiRes = await apiClient.delete(`/attendance/${id}`);
      if (apiRes?.success) {
        return { success: true };
      }
    } catch (err) {
      console.warn(`[attendanceService] Live deleteAttendance(${id}) failed, using local store:`, err.message);
    }

    // 2. Fallback to local store
    return new Promise((resolve) => {
      setTimeout(() => {
        const rawAtt = employeeService._getRawAttendance();
        const filtered = rawAtt.filter((a) => a.id !== id);
        employeeService._setRawAttendance(filtered);
        resolve({ success: true });
      }, 200);
    });
  },
};

export default attendanceService;
