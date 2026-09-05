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

    if (empObj) {
      deptObj = departments.find((d) => d.id === empObj.department_id);
      posObj = jobPositions.find((p) => p.id === empObj.job_position_id);
      schedObj = workingSchedules.find((s) => s.id === empObj.working_schedule_id);

      employee = {
        id: empObj.id,
        name: `${empObj.first_name} ${empObj.last_name}`,
        code: empObj.employee_code,
        email: empObj.email,
        avatar: empObj.avatar,
        departmentId: empObj.department_id,
        departmentName: deptObj ? deptObj.name : 'Unassigned',
        jobPositionTitle: posObj ? posObj.title : 'Unassigned',
        workingScheduleId: empObj.working_schedule_id,
        workingScheduleName: schedObj ? schedObj.name : 'Standard Shift',
        workingSchedule: schedObj || null,
      };
    }

    const calculatedMins = att.worked_minutes !== undefined && att.worked_minutes !== null
      ? att.worked_minutes
      : calculateWorkedMinutes(att.check_in, att.check_out);

    const derivedStatus = att.status || deriveAttendanceStatus(att.check_in, att.check_out, schedObj);
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
