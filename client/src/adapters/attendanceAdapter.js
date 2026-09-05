import {
  calculateWorkedMinutes,
  formatMinutesToHours,
  formatTimeOnly,
  formatDateOnly,
  deriveAttendanceStatus,
  detectExceptions,
} from '../utils/attendanceCalculator';

export const attendanceAdapter = {
  toUIModel: (att, employees = [], departments = [], jobPositions = [], workingSchedules = []) => {
    if (!att) return null;

    const empObj = employees.find((e) => e.id === att.employee_id);
    let employee = null;
    let deptObj = null;
    let posObj = null;
    let schedObj = null;

    const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : '');
    let normalizedStatus = att.status
      ? att.status === 'half_day' ? 'Half Day' : capitalize(att.status)
      : null;

    if (empObj) {
      deptObj = departments.find((d) => d.id === empObj.department_id);
      posObj = jobPositions.find((p) => p.id === empObj.job_position_id);
      schedObj = workingSchedules.find((s) => s.id === empObj.working_schedule_id);

      employee = {
        id: empObj.id,
        name: `${empObj.first_name} ${empObj.last_name}`.trim(),
        code: empObj.employee_code,
        email: empObj.email,
        avatar: empObj.avatar,
        departmentId: empObj.department_id,
        departmentName: deptObj ? deptObj.name : (empObj.department_name || 'Unassigned'),
        jobPositionTitle: posObj ? posObj.title : (empObj.job_position_title || 'Unassigned'),
        workingScheduleId: empObj.working_schedule_id,
        workingScheduleName: schedObj ? schedObj.name : 'Standard Shift',
        workingSchedule: schedObj || null,
      };
    } else {
      employee = {
        id: att.employee_id,
        name: `${att.first_name || ''} ${att.last_name || ''}`.trim() || att.employee_name || 'Employee',
        code: att.employee_code || `EMP-${att.employee_id}`,
        email: att.email || '',
        avatar: att.avatar || null,
        departmentId: att.department_id,
        departmentName: att.department_name || 'Unassigned',
        jobPositionTitle: att.job_title || 'Unassigned',
        workingScheduleId: att.working_schedule_id,
        workingScheduleName: att.working_schedule_name || 'Standard Shift',
        workingSchedule: null,
      };
    }

    const calculatedMins = att.worked_minutes !== undefined && att.worked_minutes !== null
      ? att.worked_minutes
      : calculateWorkedMinutes(att.check_in, att.check_out);

    const derivedStatus = normalizedStatus || deriveAttendanceStatus(att.check_in, att.check_out, schedObj);
    const exceptions = detectExceptions(att.check_in, att.check_out, schedObj);

    const isCorrected = Boolean(att.corrected_by || att.correction_reason);

    return {
      id: att.id,
      employeeId: att.employee_id,
      employee,
      attendanceDate: att.attendance_date || new Date().toISOString().split('T')[0],
      attendanceDateFormatted: formatDateOnly(att.attendance_date),
      checkIn: att.check_in || null,
      checkInFormatted: formatTimeOnly(att.check_in),
      checkOut: att.check_out || null,
      checkOutFormatted: formatTimeOnly(att.check_out),
      workedMinutes: calculatedMins,
      workedHoursFormatted: formatMinutesToHours(calculatedMins),
      status: derivedStatus,
      exceptions,
      isCorrected,
      correctedBy: att.corrected_by || null,
      correctionReason: att.correction_reason || null,
      correctedAt: att.updated_at || att.created_at || new Date().toISOString(),
      created_at: att.created_at || new Date().toISOString(),
      updated_at: att.updated_at || new Date().toISOString(),
    };
  },

  toAPIModel: (uiData) => {
    return {
      employee_id: uiData.employeeId || uiData.employee_id,
      attendance_date: uiData.attendanceDate || uiData.attendance_date,
      check_in: uiData.checkIn || uiData.check_in || null,
      check_out: uiData.checkOut || uiData.check_out || null,
      worked_minutes: uiData.workedMinutes !== undefined
        ? uiData.workedMinutes
        : calculateWorkedMinutes(uiData.checkIn, uiData.checkOut),
      status: uiData.status || 'Present',
      corrected_by: uiData.correctedBy || uiData.corrected_by || null,
      correction_reason: uiData.correctionReason || uiData.correction_reason || null,
    };
  },
};
