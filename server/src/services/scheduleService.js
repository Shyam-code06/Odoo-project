import { db, WorkingScheduleModel, ScheduleDayModel } from '../models/index.js';

/**
 * Calculate net worked hours for a single day schedule
 * Formula: ((endTime - startTime in mins) - breakMinutes) / 60
 */
export const calculateDayHours = (startTime, endTime, breakMinutes = 0) => {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = startTime.split(':').map((n) => parseInt(n, 10));
  const [endH, endM] = endTime.split(':').map((n) => parseInt(n, 10));

  const startTotalMinutes = startH * 60 + (startM || 0);
  const endTotalMinutes = endH * 60 + (endM || 0);

  if (endTotalMinutes <= startTotalMinutes) return 0;

  const grossMinutes = endTotalMinutes - startTotalMinutes;
  const breakMin = parseInt(breakMinutes, 10) || 0;
  const netMinutes = Math.max(0, grossMinutes - breakMin);

  return Number((netMinutes / 60).toFixed(2));
};

/**
 * Calculate total weekly hours across an array of schedule day objects
 */
export const calculateTotalWeeklyHours = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) return 0;
  const total = days.reduce((sum, day) => {
    return sum + calculateDayHours(day.start_time, day.end_time, day.break_minutes);
  }, 0);
  return Number(total.toFixed(2));
};

/**
 * Format schedule object with computed day hours and total weekly hours
 */
export const formatScheduleWithHours = (schedule, days = []) => {
  const formattedDays = days.map((day) => ({
    ...day,
    daily_hours: calculateDayHours(day.start_time, day.end_time, day.break_minutes)
  }));

  return {
    ...schedule,
    total_weekly_hours: calculateTotalWeeklyHours(formattedDays),
    days: formattedDays
  };
};

export class ScheduleService {
  /**
   * Get all schedules with pagination, search, active filter, and computed weekly hours
   * @param {object} params
   */
  async getSchedules(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;
    const isActive = params.is_active !== undefined ? params.is_active === 'true' || params.is_active === true : null;

    let query = db('working_schedules');

    if (search) {
      query = query.where((builder) => {
        builder
          .where('name', 'like', `%${search}%`)
          .orWhere('description', 'like', `%${search}%`);
      });
    }

    if (isActive !== null) {
      query = query.where('is_active', isActive);
    }

    const countResult = await query.clone().count('id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const schedules = await query
      .select(
        'working_schedules.*',
        db.raw('(SELECT COUNT(id) FROM employees WHERE employees.working_schedule_id = working_schedules.id) as assigned_employee_count'),
        db.raw('(SELECT COUNT(contracts.id) FROM contracts JOIN employees ON contracts.employee_id = employees.id WHERE employees.working_schedule_id = working_schedules.id AND contracts.status = \'active\') as active_contract_count')
      )
      .orderBy('working_schedules.id', 'desc')
      .limit(limit)
      .offset(offset);

    if (schedules.length === 0) {
      return {
        data: [],
        pagination: { page, limit, total, totalPages }
      };
    }

    const scheduleIds = schedules.map((s) => s.id);
    const allDays = await db('schedule_days')
      .whereIn('schedule_id', scheduleIds)
      .orderBy('id', 'asc');

    const daysBySchedule = {};
    for (const day of allDays) {
      if (!daysBySchedule[day.schedule_id]) {
        daysBySchedule[day.schedule_id] = [];
      }
      daysBySchedule[day.schedule_id].push(day);
    }

    const formattedData = schedules.map((s) => {
      const days = daysBySchedule[s.id] || [];
      return formatScheduleWithHours(s, days);
    });

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
   * Get single schedule by ID with full day pattern and calculated weekly hours
   * @param {number|string} id
   */
  async getScheduleById(id) {
    const schedule = await WorkingScheduleModel.findById(id);
    if (!schedule) return null;

    const days = await db('schedule_days')
      .where('schedule_id', id)
      .orderBy('id', 'asc');

    // Count assigned employees and contracts for metadata
    const [empCount] = await db('employees').where('working_schedule_id', id).count('id as count');
    const [contractCount] = await db('contracts').where('working_schedule_id', id).count('id as count');

    const formatted = formatScheduleWithHours(schedule, days);
    return {
      ...formatted,
      assigned_employees_count: parseInt(empCount?.count || 0, 10),
      assigned_contracts_count: parseInt(contractCount?.count || 0, 10)
    };
  }

  /**
   * Create a new working schedule (with optional initial days pattern)
   * @param {object} payload
   */
  async createSchedule(payload) {
    const { name, description, timezone = 'UTC', is_active = true, days = [] } = payload;

    return await db.transaction(async (trx) => {
      // 1. Insert schedule
      const [newId] = await trx('working_schedules').insert({
        name: name.trim(),
        description: description ? description.trim() : null,
        timezone: timezone.trim(),
        is_active: is_active ?? true
      });

      // 2. Insert days if provided
      const insertedDays = [];
      if (Array.isArray(days) && days.length > 0) {
        for (const day of days) {
          const [dayId] = await trx('schedule_days').insert({
            schedule_id: newId,
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            break_minutes: parseInt(day.break_minutes, 10) || 0
          });
          insertedDays.push({
            id: dayId,
            schedule_id: newId,
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            break_minutes: parseInt(day.break_minutes, 10) || 0
          });
        }
      }

      const createdSchedule = await trx('working_schedules').where('id', newId).first();
      return formatScheduleWithHours(createdSchedule, insertedDays);
    });
  }

  /**
   * Update an existing working schedule
   * @param {number|string} id
   * @param {object} payload
   */
  async updateSchedule(id, payload) {
    const existing = await WorkingScheduleModel.findById(id);
    if (!existing) {
      const error = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    const { name, description, timezone, is_active, days } = payload;

    return await db.transaction(async (trx) => {
      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (timezone !== undefined) updateData.timezone = timezone.trim();
      if (is_active !== undefined) updateData.is_active = is_active;
      updateData.updated_at = trx.fn.now();

      if (Object.keys(updateData).length > 0) {
        await trx('working_schedules').where('id', id).update(updateData);
      }

      // If days array explicitly passed, replace existing days
      if (days !== undefined && Array.isArray(days)) {
        await trx('schedule_days').where('schedule_id', id).del();
        for (const day of days) {
          await trx('schedule_days').insert({
            schedule_id: id,
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            break_minutes: parseInt(day.break_minutes, 10) || 0
          });
        }
      }

      const updatedSchedule = await trx('working_schedules').where('id', id).first();
      const updatedDays = await trx('schedule_days').where('schedule_id', id).orderBy('id', 'asc');

      return formatScheduleWithHours(updatedSchedule, updatedDays);
    });
  }

  /**
   * Delete schedule with reference integrity check
   * @param {number|string} id
   */
  async deleteSchedule(id) {
    const existing = await WorkingScheduleModel.findById(id);
    if (!existing) {
      const error = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    // Check if referenced by employees
    const [empRef] = await db('employees').where('working_schedule_id', id).count('id as count');
    if (parseInt(empRef?.count || 0, 10) > 0) {
      const error = new Error(`Cannot delete schedule '${existing.name}' because it is assigned to ${empRef.count} employee(s).`);
      error.statusCode = 409;
      throw error;
    }

    // Check if referenced by contracts
    const [contractRef] = await db('contracts').where('working_schedule_id', id).count('id as count');
    if (parseInt(contractRef?.count || 0, 10) > 0) {
      const error = new Error(`Cannot delete schedule '${existing.name}' because it is referenced in ${contractRef.count} contract(s).`);
      error.statusCode = 409;
      throw error;
    }

    return await db.transaction(async (trx) => {
      await trx('schedule_days').where('schedule_id', id).del();
      await trx('working_schedules').where('id', id).del();
      return true;
    });
  }

  /**
   * Add a single day to a schedule
   * @param {number|string} scheduleId
   * @param {object} dayData
   */
  async addScheduleDay(scheduleId, dayData) {
    const schedule = await WorkingScheduleModel.findById(scheduleId);
    if (!schedule) {
      const error = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    const { day_of_week, start_time, end_time, break_minutes = 0 } = dayData;

    // Check duplicate day_of_week
    const existingDay = await db('schedule_days')
      .where({ schedule_id: scheduleId, day_of_week })
      .first();

    if (existingDay) {
      const error = new Error(`Schedule already contains an entry for '${day_of_week}'`);
      error.statusCode = 409;
      throw error;
    }

    const [dayId] = await db('schedule_days').insert({
      schedule_id: scheduleId,
      day_of_week,
      start_time,
      end_time,
      break_minutes: parseInt(break_minutes, 10) || 0
    });

    return await this.getScheduleById(scheduleId);
  }

  /**
   * Update a specific schedule day
   * @param {number|string} scheduleId
   * @param {number|string} dayId
   * @param {object} dayData
   */
  async updateScheduleDay(scheduleId, dayId, dayData) {
    const schedule = await WorkingScheduleModel.findById(scheduleId);
    if (!schedule) {
      const error = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    const dayRecord = await db('schedule_days')
      .where({ id: dayId, schedule_id: scheduleId })
      .first();

    if (!dayRecord) {
      const error = new Error('Schedule day not found for this schedule');
      error.statusCode = 404;
      throw error;
    }

    const { day_of_week, start_time, end_time, break_minutes } = dayData;

    // If changing day_of_week, check collision
    if (day_of_week && day_of_week !== dayRecord.day_of_week) {
      const duplicate = await db('schedule_days')
        .where({ schedule_id: scheduleId, day_of_week })
        .whereNot('id', dayId)
        .first();

      if (duplicate) {
        const error = new Error(`Schedule already contains an entry for '${day_of_week}'`);
        error.statusCode = 409;
        throw error;
      }
    }

    const updatePayload = {};
    if (day_of_week) updatePayload.day_of_week = day_of_week;
    if (start_time) updatePayload.start_time = start_time;
    if (end_time) updatePayload.end_time = end_time;
    if (break_minutes !== undefined) updatePayload.break_minutes = parseInt(break_minutes, 10) || 0;
    updatePayload.updated_at = db.fn.now();

    await db('schedule_days').where('id', dayId).update(updatePayload);

    return await this.getScheduleById(scheduleId);
  }

  /**
   * Delete a specific schedule day
   * @param {number|string} scheduleId
   * @param {number|string} dayId
   */
  async deleteScheduleDay(scheduleId, dayId) {
    const schedule = await WorkingScheduleModel.findById(scheduleId);
    if (!schedule) {
      const error = new Error('Working schedule not found');
      error.statusCode = 404;
      throw error;
    }

    const dayRecord = await db('schedule_days')
      .where({ id: dayId, schedule_id: scheduleId })
      .first();

    if (!dayRecord) {
      const error = new Error('Schedule day not found for this schedule');
      error.statusCode = 404;
      throw error;
    }

    await db('schedule_days').where('id', dayId).del();

    return await this.getScheduleById(scheduleId);
  }
}

export default new ScheduleService();
