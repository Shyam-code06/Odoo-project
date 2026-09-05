import { employeeService } from './employeeService';
import { attendanceAdapter } from '../adapters/attendanceAdapter';
import { calculateWorkedMinutes, deriveAttendanceStatus } from '../utils/attendanceCalculator';

export const attendanceService = {
  getAttendanceRecords: async (params = {}) => {
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

        // Employee Self-Service Scope Filter
        if (params.restrictEmployeeId) {
          list = list.filter((a) => a.employeeId === params.restrictEmployeeId);
        } else if (params.employeeId || params.employee_id) {
          const empId = params.employeeId || params.employee_id;
          list = list.filter((a) => a.employeeId === empId);
        }

        // Search filter (Employee name, code)
        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          list = list.filter(
            (a) =>
              (a.employee && a.employee.name.toLowerCase().includes(q)) ||
              (a.employee && a.employee.code.toLowerCase().includes(q))
          );
        }

        // Department filter
        if (params.departmentId || params.department_id) {
          const deptId = params.departmentId || params.department_id;
          list = list.filter((a) => a.employee && a.employee.departmentId === deptId);
        }

        // Working Schedule filter
        if (params.workingScheduleId || params.working_schedule_id) {
          const schedId = params.workingScheduleId || params.working_schedule_id;
          list = list.filter((a) => a.employee && a.employee.workingScheduleId === schedId);
        }

        // Status filter
        if (params.status) {
          list = list.filter(
            (a) => a.status.toLowerCase() === params.status.toLowerCase()
          );
        }

        // Date filter
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

        // Summary metrics calculation
        const totalRecords = list.length;
        const presentCount = list.filter((a) => a.status === 'Present').length;
        const lateCount = list.filter((a) => a.status === 'Late').length;
        const absentCount = list.filter((a) => a.status === 'Absent').length;
        const missingCheckOutCount = list.filter((a) => a.exceptions && a.exceptions.isMissingCheckOut).length;
        const correctedCount = list.filter((a) => a.isCorrected).length;

        // Sorting
        if (params.sortBy) {
          const key = params.sortBy;
          const dir = params.sortDirection === 'desc' ? -1 : 1;
          list.sort((a, b) => {
            let valA = a[key];
            let valB = b[key];

            if (key === 'employeeName') {
              valA = a.employee ? a.employee.name : '';
              valB = b.employee ? b.employee.name : '';
            }

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
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const rawAtt = employeeService._getRawAttendance();
        const apiData = attendanceAdapter.toAPIModel(formData);

        if (!apiData.employee_id) {
          reject(new Error('Employee selection is required.'));
          return;
        }

        if (!apiData.attendance_date) {
          reject(new Error('Attendance date is required.'));
          return;
        }

        // Check duplicate
        if (attendanceService.checkDuplicateAttendance(apiData.employee_id, apiData.attendance_date)) {
          reject(new Error(`An attendance record already exists for this employee on ${apiData.attendance_date}.`));
          return;
        }

        // Validate Check-out after Check-in
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

        const apiData = attendanceAdapter.toAPIModel(formData);

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
