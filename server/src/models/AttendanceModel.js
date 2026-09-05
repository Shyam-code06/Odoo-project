import BaseModel from './BaseModel.js';

export class AttendanceModel extends BaseModel {
  constructor() {
    super('attendance', 'id');
  }

  /**
   * Find attendance record for an employee on a specific date
   * @param {number|string} employeeId
   * @param {string} date - Format YYYY-MM-DD
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByEmployeeAndDate(employeeId, date, trx = null) {
    return await this.findOne(
      {
        employee_id: employeeId,
        attendance_date: date,
      },
      ['*'],
      trx
    );
  }

  /**
   * Get attendance records with employee details within a date range
   * @param {string} startDate
   * @param {string} endDate
   * @param {object} [filter={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getAttendanceReport(startDate, endDate, filter = {}, trx = null) {
    let q = this.query(trx)
      .leftJoin('employees', 'attendance.employee_id', 'employees.id')
      .leftJoin('departments', 'employees.department_id', 'departments.id')
      .leftJoin('users as corrector', 'attendance.corrected_by', 'corrector.id')
      .whereBetween('attendance.attendance_date', [startDate, endDate])
      .select(
        'attendance.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'departments.name as department_name',
        'corrector.email as corrector_email'
      );
    if (filter && Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    return await q.orderBy('attendance.attendance_date', 'desc');
  }

  /**
   * Record check-in
   * @param {number|string} employeeId
   * @param {string} attendanceDate - YYYY-MM-DD
   * @param {Date|string} checkInTime
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async checkIn(employeeId, attendanceDate, checkInTime, trx = null) {
    const existing = await this.findByEmployeeAndDate(employeeId, attendanceDate, trx);
    if (existing) {
      return await this.updateById(
        existing.id,
        {
          check_in: checkInTime,
          status: 'present',
        },
        trx
      );
    }

    return await this.create(
      {
        employee_id: employeeId,
        attendance_date: attendanceDate,
        check_in: checkInTime,
        status: 'present',
      },
      trx
    );
  }

  /**
   * Record check-out and compute worked minutes
   * @param {number|string} employeeId
   * @param {string} attendanceDate - YYYY-MM-DD
   * @param {Date|string} checkOutTime
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async checkOut(employeeId, attendanceDate, checkOutTime, trx = null) {
    const record = await this.findByEmployeeAndDate(employeeId, attendanceDate, trx);
    if (!record) {
      throw new Error(`No check-in found for employee ${employeeId} on ${attendanceDate}`);
    }

    const checkInDate = new Date(record.check_in);
    const checkOutDate = new Date(checkOutTime);
    const workedMinutes = Math.max(0, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60)));

    return await this.updateById(
      record.id,
      {
        check_out: checkOutTime,
        worked_minutes: workedMinutes,
      },
      trx
    );
  }
}

export default new AttendanceModel();
