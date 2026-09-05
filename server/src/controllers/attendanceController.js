import attendanceService from '../services/attendanceService.js';

/**
 * POST /api/attendance/check-in
 * Employee check-in with GPS geofence on-site verification
 */
export const checkIn = async (req, res) => {
  try {
    const record = await attendanceService.checkIn(req.user, req.body);
    return res.status(201).json({
      success: true,
      message: 'Check-in recorded successfully.',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'CHECK_IN_ERROR'
    });
  }
};

/**
 * POST /api/attendance/check-out
 * Employee check-out with GPS geofence on-site verification
 */
export const checkOut = async (req, res) => {
  try {
    const record = await attendanceService.checkOut(req.user, req.body);
    return res.status(200).json({
      success: true,
      message: 'Check-out recorded successfully.',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'CHECK_OUT_ERROR'
    });
  }
};

/**
 * GET /api/attendance/today
 * Get today's attendance summary & check-in state for the authenticated employee
 */
export const getTodayStatus = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account.'
      });
    }

    const todayStatus = await attendanceService.getTodayStatus(req.user.employee_id);
    return res.status(200).json({
      success: true,
      data: todayStatus
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET /api/attendance/my
 * View own attendance history (never trust client supplied employee IDs)
 */
export const getMyAttendance = async (req, res) => {
  try {
    if (!req.user.employee_id) {
      return res.status(400).json({
        success: false,
        message: 'No employee profile linked to this user account.'
      });
    }

    const filterParams = {
      ...req.query,
      employee_id: req.user.employee_id // Enforce self ownership
    };

    const result = await attendanceService.getAttendanceList(filterParams);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET /api/attendance
 * List/filter attendance records (HR / Admin)
 */
export const getAttendanceList = async (req, res) => {
  try {
    const result = await attendanceService.getAttendanceList(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * GET /api/attendance/:id
 * Get single attendance record with schedule & audit details
 */
export const getAttendanceById = async (req, res) => {
  try {
    const record = await attendanceService.getAttendanceById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found.'
      });
    }

    // Normal employee can only view their own attendance record
    const isHrOrAdmin = ['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'].includes(
      (req.user.role_code || req.user.role_name || '').toUpperCase().replace(/\s+/g, '_')
    );

    if (!isHrOrAdmin && record.employee_id !== req.user.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to view another employee\'s attendance record.'
      });
    }

    return res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * POST /api/attendance
 * Manual attendance record creation by authorized HR/Admin
 */
export const createManualAttendance = async (req, res) => {
  try {
    const created = await attendanceService.createManualAttendance(req.user.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Attendance record created successfully.',
      data: created
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * PUT / PATCH /api/attendance/:id/correct
 * Correct attendance record (check_in, check_out, status, attendance_date) with mandatory reason
 */
export const correctAttendance = async (req, res) => {
  try {
    const updated = await attendanceService.correctAttendance(req.params.id, req.user.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Attendance record corrected successfully.',
      data: updated
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};

/**
 * DELETE /api/attendance/:id
 * Delete an attendance record (HR/Admin)
 */
export const deleteAttendance = async (req, res) => {
  try {
    await attendanceService.deleteAttendance(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Attendance record deleted successfully.'
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message
    });
  }
};
