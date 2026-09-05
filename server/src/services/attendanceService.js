import { db, AttendanceModel, EmployeeModel, WorkingScheduleModel, UserModel } from '../models/index.js';
import { verifyGeofenceLocation, getOfficeCoordinates } from '../utils/geolocation.js';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format Date object to 'YYYY-MM-DD'
 */
const formatDate = (dateObj) => {
  const d = dateObj ? new Date(dateObj) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format Date object to MySQL DATETIME 'YYYY-MM-DD HH:mm:ss'
 */
const formatDateTime = (dateObj) => {
  const d = dateObj ? new Date(dateObj) : new Date();
  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${datePart} ${hours}:${minutes}:${seconds}`;
};

export class AttendanceService {
  /**
   * Helper: Resolve scheduled shift and working hours for an employee on a given date
   * @param {number|string} employeeId
   * @param {string} attendanceDate - 'YYYY-MM-DD'
   */
  async getEmployeeScheduleForDate(employeeId, attendanceDate) {
    const employee = await EmployeeModel.findById(employeeId);
    if (!employee) return null;

    let scheduleId = employee.working_schedule_id;

    // If not directly on employee, check active contract
    if (!scheduleId) {
      const activeContract = await db('contracts')
        .where({ employee_id: employeeId, status: 'active' })
        .where('start_date', '<=', attendanceDate)
        .andWhere((b) => {
          b.whereNull('end_date').orWhere('end_date', '>=', attendanceDate);
        })
        .first();

      if (activeContract?.working_schedule_id) {
        scheduleId = activeContract.working_schedule_id;
      }
    }

    if (!scheduleId) return null;

    const schedule = await WorkingScheduleModel.findById(scheduleId);
    if (!schedule || !schedule.is_active) return null;

    // Determine Day of Week (e.g. 'Monday')
    const dateObj = new Date(attendanceDate);
    const dayName = DAYS_OF_WEEK[dateObj.getDay()];

    const scheduledDay = await db('schedule_days')
      .where({ schedule_id: scheduleId, day_of_week: dayName })
      .first();

    if (!scheduledDay) {
      return {
        schedule_id: scheduleId,
        schedule_name: schedule.name,
        day_of_week: dayName,
        is_working_day: false,
        scheduled_start: null,
        scheduled_end: null,
        break_minutes: 0,
        scheduled_minutes: 0
      };
    }

    const [startH, startM] = scheduledDay.start_time.split(':').map((n) => parseInt(n, 10));
    const [endH, endM] = scheduledDay.end_time.split(':').map((n) => parseInt(n, 10));
    const grossMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    const netScheduledMinutes = Math.max(0, grossMinutes - (scheduledDay.break_minutes || 0));

    return {
      schedule_id: scheduleId,
      schedule_name: schedule.name,
      day_of_week: dayName,
      is_working_day: true,
      scheduled_start: scheduledDay.start_time,
      scheduled_end: scheduledDay.end_time,
      break_minutes: scheduledDay.break_minutes || 0,
      scheduled_minutes: netScheduledMinutes
    };
  }

  /**
   * Helper: Derive attendance status based on timestamps and scheduled shift
   */
  deriveStatus(checkInTime, checkOutTime, scheduledShift) {
    if (!scheduledShift || !scheduledShift.is_working_day || !scheduledShift.scheduled_start) {
      return 'present';
    }

    const checkIn = new Date(checkInTime);
    const [startH, startM] = scheduledShift.scheduled_start.split(':').map((n) => parseInt(n, 10));
    const scheduledStartMinutes = startH * 60 + startM;

    const actualCheckInMinutes = checkIn.getHours() * 60 + checkIn.getMinutes();

    let isLate = actualCheckInMinutes > scheduledStartMinutes + 15; // 15 mins grace period

    if (checkOutTime) {
      const checkOut = new Date(checkOutTime);
      const workedMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)));

      // If worked less than 50% of scheduled hours -> half_day
      if (scheduledShift.scheduled_minutes > 0 && workedMinutes < scheduledShift.scheduled_minutes * 0.5) {
        return 'half_day';
      }
    }

    return isLate ? 'late' : 'present';
  }

  /**
   * Check In with GPS on-site verification
   * @param {object} user - Authenticated user
   * @param {object} payload
   */
  async checkIn(user, payload = {}) {
    const isHrOrAdmin = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(
      (user.role_code || user.role_name || '').toUpperCase().replace(/\s+/g, '_')
    );

    const targetEmployeeId = isHrOrAdmin && payload.employee_id
      ? parseInt(payload.employee_id, 10)
      : user.employee_id;

    if (!targetEmployeeId) {
      const error = new Error('No employee profile is associated with this user account.');
      error.statusCode = 400;
      throw error;
    }

    // Verify employee exists
    const employee = await EmployeeModel.findById(targetEmployeeId);
    if (!employee) {
      const error = new Error(`Employee with ID ${targetEmployeeId} does not exist.`);
      error.statusCode = 404;
      throw error;
    }

    // 1. GPS On-Site Geofence Verification
    let geoVerification = null;
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      geoVerification = verifyGeofenceLocation(payload.latitude, payload.longitude);
      if (!geoVerification.isWithinRadius) {
        const error = new Error(
          `On-site verification failed: You are ${Math.round(geoVerification.distanceMeters)} meters away from the office site (allowed radius: ${geoVerification.allowedRadiusMeters} meters). Check-in is only permitted when physically on-site.`
        );
        error.statusCode = 403;
        error.code = 'OUTSIDE_GEOFENCE';
        throw error;
      }
    } else if (!isHrOrAdmin) {
      const error = new Error('GPS coordinates are required for on-site check-in verification.');
      error.statusCode = 400;
      error.code = 'GEOLOCATION_REQUIRED';
      throw error;
    }

    const checkInDate = payload.check_in ? new Date(payload.check_in) : new Date();
    const attendanceDate = payload.attendance_date || formatDate(checkInDate);
    const formattedCheckIn = formatDateTime(checkInDate);

    // Check existing attendance record for this employee and date
    const existing = await AttendanceModel.findByEmployeeAndDate(targetEmployeeId, attendanceDate);
    if (existing) {
      if (existing.check_in && !existing.check_out) {
        const error = new Error(`Employee is already checked in for ${attendanceDate} at ${existing.check_in}.`);
        error.statusCode = 409;
        throw error;
      }
      if (existing.check_in && existing.check_out) {
        const error = new Error(`Attendance for ${attendanceDate} is already completed (Checked out at ${existing.check_out}).`);
        error.statusCode = 409;
        throw error;
      }
    }

    const scheduledShift = await this.getEmployeeScheduleForDate(targetEmployeeId, attendanceDate);
    const status = this.deriveStatus(formattedCheckIn, null, scheduledShift);

    let resultRecord;
    if (existing) {
      await AttendanceModel.updateById(existing.id, {
        check_in: formattedCheckIn,
        status,
        latitude: payload.latitude ? parseFloat(payload.latitude) : null,
        longitude: payload.longitude ? parseFloat(payload.longitude) : null,
        verification_distance: geoVerification?.distanceMeters || null,
        updated_at: db.fn.now()
      });
      resultRecord = await this.getAttendanceById(existing.id);
    } else {
      const created = await AttendanceModel.create({
        employee_id: targetEmployeeId,
        attendance_date: attendanceDate,
        check_in: formattedCheckIn,
        check_out: null,
        worked_minutes: 0,
        status,
        latitude: payload.latitude ? parseFloat(payload.latitude) : null,
        longitude: payload.longitude ? parseFloat(payload.longitude) : null,
        verification_distance: geoVerification?.distanceMeters || null
      });
      resultRecord = await this.getAttendanceById(created.id);
    }

    return {
      ...resultRecord,
      scheduled_shift: scheduledShift,
      geolocation_verification: geoVerification
        ? {
            is_verified: true,
            distance_meters: geoVerification.distanceMeters,
            allowed_radius_meters: geoVerification.allowedRadiusMeters
          }
        : null
    };
  }

  /**
   * Check Out with GPS on-site verification
   * @param {object} user - Authenticated user
   * @param {object} payload
   */
  async checkOut(user, payload = {}) {
    const isHrOrAdmin = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'].includes(
      (user.role_code || user.role_name || '').toUpperCase().replace(/\s+/g, '_')
    );

    const targetEmployeeId = isHrOrAdmin && payload.employee_id
      ? parseInt(payload.employee_id, 10)
      : user.employee_id;

    if (!targetEmployeeId) {
      const error = new Error('No employee profile is associated with this user account.');
      error.statusCode = 400;
      throw error;
    }

    // 1. GPS On-Site Geofence Verification
    let geoVerification = null;
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      geoVerification = verifyGeofenceLocation(payload.latitude, payload.longitude);
      if (!geoVerification.isWithinRadius) {
        const error = new Error(
          `On-site verification failed: You are ${Math.round(geoVerification.distanceMeters)} meters away from the office site (allowed radius: ${geoVerification.allowedRadiusMeters} meters). Check-out is only permitted when physically on-site.`
        );
        error.statusCode = 403;
        error.code = 'OUTSIDE_GEOFENCE';
        throw error;
      }
    } else if (!isHrOrAdmin) {
      const error = new Error('GPS coordinates are required for on-site check-out verification.');
      error.statusCode = 400;
      error.code = 'GEOLOCATION_REQUIRED';
      throw error;
    }

    const checkOutDate = payload.check_out ? new Date(payload.check_out) : new Date();
    const attendanceDate = payload.attendance_date || formatDate(checkOutDate);
    const formattedCheckOut = formatDateTime(checkOutDate);

    // Find active attendance record
    const existing = await AttendanceModel.findByEmployeeAndDate(targetEmployeeId, attendanceDate);
    if (!existing || !existing.check_in) {
      const error = new Error(`No active check-in found for employee on ${attendanceDate}. Please check in first.`);
      error.statusCode = 404;
      throw error;
    }

    if (existing.check_out) {
      const error = new Error(`Employee has already checked out for ${attendanceDate} at ${existing.check_out}.`);
      error.statusCode = 409;
      throw error;
    }

    const checkInDate = new Date(existing.check_in);
    if (checkOutDate.getTime() <= checkInDate.getTime()) {
      const error = new Error('Check-out timestamp must be strictly after check-in timestamp.');
      error.statusCode = 400;
      throw error;
    }

    // Calculate worked minutes
    const workedMinutes = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60)));

    const scheduledShift = await this.getEmployeeScheduleForDate(targetEmployeeId, attendanceDate);
    const status = this.deriveStatus(existing.check_in, formattedCheckOut, scheduledShift);

    await AttendanceModel.updateById(existing.id, {
      check_out: formattedCheckOut,
      worked_minutes: workedMinutes,
      status,
      updated_at: db.fn.now()
    });

    const updated = await this.getAttendanceById(existing.id);
    return {
      ...updated,
      scheduled_shift: scheduledShift,
      geolocation_verification: geoVerification
        ? {
            is_verified: true,
            distance_meters: geoVerification.distanceMeters,
            allowed_radius_meters: geoVerification.allowedRadiusMeters
          }
        : null
    };
  }

  /**
   * Get single attendance record by ID with joined relations
   * @param {number|string} id
   */
  async getAttendanceById(id) {
    const record = await db('attendance')
      .leftJoin('employees', 'attendance.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('job_positions', 'employees.job_position_id', 'job_positions.id')
      .leftJoin('users as corrector', 'attendance.corrected_by', 'corrector.id')
      .where('attendance.id', id)
      .select(
        'attendance.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'departments.name as department_name',
        'job_positions.title as job_position_title',
        'corrector.email as corrector_email'
      )
      .first();

    if (!record) return null;

    return {
      ...record,
      worked_hours: Number((record.worked_minutes / 60).toFixed(2))
    };
  }

  /**
   * Get today's attendance status for an employee
   * @param {number|string} employeeId
   */
  async getTodayStatus(employeeId) {
    const today = formatDate(new Date());
    const record = await AttendanceModel.findByEmployeeAndDate(employeeId, today);
    const scheduledShift = await this.getEmployeeScheduleForDate(employeeId, today);

    if (!record) {
      return {
        date: today,
        has_checked_in: false,
        has_checked_out: false,
        status: 'not_marked',
        record: null,
        scheduled_shift: scheduledShift
      };
    }

    return {
      date: today,
      has_checked_in: Boolean(record.check_in),
      has_checked_out: Boolean(record.check_out),
      status: record.status,
      record: {
        ...record,
        worked_hours: Number((record.worked_minutes / 60).toFixed(2))
      },
      scheduled_shift: scheduledShift
    };
  }

  /**
   * List attendance records with filtering, search, and pagination
   * @param {object} params
   */
  async getAttendanceList(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;

    let query = db('attendance')
      .leftJoin('employees', 'attendance.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('users as corrector', 'attendance.corrected_by', 'corrector.id');

    if (params.employee_id) {
      query = query.where('attendance.employee_id', params.employee_id);
    }

    if (params.department_id) {
      query = query.where('employees.department_id', params.department_id);
    }

    if (params.status) {
      query = query.where('attendance.status', params.status.toLowerCase());
    }

    if (params.date_from) {
      query = query.where('attendance.attendance_date', '>=', params.date_from);
    }

    if (params.date_to) {
      query = query.where('attendance.attendance_date', '<=', params.date_to);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('employees.first_name', 'like', `%${search}%`)
          .orWhere('employees.last_name', 'like', `%${search}%`)
          .orWhere('employees.employee_code', 'like', `%${search}%`)
          .orWhere('attendance.attendance_date', 'like', `%${search}%`);
      });
    }

    const countResult = await query.clone().count('attendance.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await query
      .select(
        'attendance.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'departments.name as department_name',
        'corrector.email as corrector_email'
      )
      .orderBy('attendance.attendance_date', 'desc')
      .orderBy('attendance.id', 'desc')
      .limit(limit)
      .offset(offset);

    const formattedData = rows.map((r) => ({
      ...r,
      worked_hours: Number((r.worked_minutes / 60).toFixed(2))
    }));

    return {
      data: formattedData,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Manual Attendance Correction (HR/Admin)
   * @param {number|string} id
   * @param {number|string} correctorUserId
   * @param {object} payload
   */
  async correctAttendance(id, correctorUserId, payload) {
    const existing = await AttendanceModel.findById(id);
    if (!existing) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    const { check_in, check_out, attendance_date, status, correction_reason } = payload;

    const finalCheckIn = check_in !== undefined ? (check_in ? formatDateTime(new Date(check_in)) : null) : existing.check_in;
    const finalCheckOut = check_out !== undefined ? (check_out ? formatDateTime(new Date(check_out)) : null) : existing.check_out;
    const finalDate = attendance_date || existing.attendance_date;

    // Check unique constraint if date changed
    if (attendance_date && attendance_date !== existing.attendance_date) {
      const duplicate = await db('attendance')
        .where({ employee_id: existing.employee_id, attendance_date })
        .whereNot('id', id)
        .first();

      if (duplicate) {
        const error = new Error(`An attendance record already exists for this employee on ${attendance_date}`);
        error.statusCode = 409;
        throw error;
      }
    }

    // Recalculate worked minutes if both timestamps present
    let workedMinutes = existing.worked_minutes;
    if (finalCheckIn && finalCheckOut) {
      const inDate = new Date(finalCheckIn);
      const outDate = new Date(finalCheckOut);
      if (outDate.getTime() <= inDate.getTime()) {
        const error = new Error('Check-out timestamp must be strictly after check-in timestamp.');
        error.statusCode = 400;
        throw error;
      }
      workedMinutes = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60)));
    } else if (!finalCheckIn || !finalCheckOut) {
      workedMinutes = 0;
    }

    const updatePayload = {
      attendance_date: finalDate,
      check_in: finalCheckIn,
      check_out: finalCheckOut,
      worked_minutes: workedMinutes,
      corrected_by: correctorUserId,
      correction_reason: correction_reason.trim(),
      updated_at: db.fn.now()
    };

    if (status) {
      updatePayload.status = status.toLowerCase();
    }

    await AttendanceModel.updateById(id, updatePayload);

    return await this.getAttendanceById(id);
  }

  /**
   * Manual Attendance Record Creation (HR/Admin)
   * @param {number|string} correctorUserId
   * @param {object} payload
   */
  async createManualAttendance(correctorUserId, payload) {
    const {
      employee_id,
      attendance_date,
      check_in,
      check_out,
      status = 'present',
      correction_reason,
      latitude,
      longitude
    } = payload;

    const employee = await EmployeeModel.findById(employee_id);
    if (!employee) {
      const error = new Error(`Employee with ID ${employee_id} does not exist.`);
      error.statusCode = 404;
      throw error;
    }

    // Check duplicate
    const existing = await AttendanceModel.findByEmployeeAndDate(employee_id, attendance_date);
    if (existing) {
      const error = new Error(`Attendance record already exists for employee ${employee_id} on ${attendance_date}. Please use the correction endpoint to modify it.`);
      error.statusCode = 409;
      throw error;
    }

    const finalCheckIn = check_in ? formatDateTime(new Date(check_in)) : null;
    const finalCheckOut = check_out ? formatDateTime(new Date(check_out)) : null;

    let workedMinutes = 0;
    if (finalCheckIn && finalCheckOut) {
      const inDate = new Date(finalCheckIn);
      const outDate = new Date(finalCheckOut);
      if (outDate.getTime() <= inDate.getTime()) {
        const error = new Error('Check-out timestamp must be strictly after check-in timestamp.');
        error.statusCode = 400;
        throw error;
      }
      workedMinutes = Math.max(0, Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60)));
    }

    const created = await AttendanceModel.create({
      employee_id,
      attendance_date,
      check_in: finalCheckIn,
      check_out: finalCheckOut,
      worked_minutes: workedMinutes,
      status: status.toLowerCase(),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      corrected_by: correctorUserId,
      correction_reason: correction_reason ? correction_reason.trim() : 'Manual HR entry'
    });

    return await this.getAttendanceById(created.id);
  }

  /**
   * Delete attendance record
   * @param {number|string} id
   */
  async deleteAttendance(id) {
    const existing = await AttendanceModel.findById(id);
    if (!existing) {
      const error = new Error('Attendance record not found');
      error.statusCode = 404;
      throw error;
    }

    await AttendanceModel.deleteById(id);
    return true;
  }
}

export default new AttendanceService();
