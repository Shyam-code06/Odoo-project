import scheduleService from '../services/scheduleService.js';

/**
 * GET /api/schedules
 * List schedules with days and weekly hours
 */
export const getSchedules = async (req, res, next) => {
  try {
    const result = await scheduleService.getSchedules(req.query);
    return res.status(200).json({
      success: true,
      message: 'Schedules fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/schedules/:id
 * Get single schedule by ID with full day pattern
 */
export const getScheduleById = async (req, res, next) => {
  try {
    const schedule = await scheduleService.getScheduleById(req.params.id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Working schedule not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Schedule fetched successfully',
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/schedules
 * Create a new working schedule
 */
export const createSchedule = async (req, res, next) => {
  try {
    const created = await scheduleService.createSchedule(req.body);
    return res.status(201).json({
      success: true,
      message: 'Working schedule created successfully',
      data: created
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PUT /api/schedules/:id
 * Update an existing working schedule
 */
export const updateSchedule = async (req, res, next) => {
  try {
    const updated = await scheduleService.updateSchedule(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Working schedule updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/schedules/:id
 * Delete a working schedule (if not referenced by employees/contracts)
 */
export const deleteSchedule = async (req, res, next) => {
  try {
    await scheduleService.deleteSchedule(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Working schedule deleted successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /api/schedules/:id/days
 * Add a day to a schedule
 */
export const addScheduleDay = async (req, res, next) => {
  try {
    const updated = await scheduleService.addScheduleDay(req.params.id, req.body);
    return res.status(201).json({
      success: true,
      message: 'Schedule day added successfully',
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PUT /api/schedules/:id/days/:dayId
 * Update a specific schedule day
 */
export const updateScheduleDay = async (req, res, next) => {
  try {
    const updated = await scheduleService.updateScheduleDay(
      req.params.id,
      req.params.dayId,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: 'Schedule day updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/schedules/:id/days/:dayId
 * Delete a specific schedule day
 */
export const deleteScheduleDay = async (req, res, next) => {
  try {
    const updated = await scheduleService.deleteScheduleDay(
      req.params.id,
      req.params.dayId
    );
    return res.status(200).json({
      success: true,
      message: 'Schedule day deleted successfully',
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

export default {
  getSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  addScheduleDay,
  updateScheduleDay,
  deleteScheduleDay
};
