import timeOffTypeService from '../services/timeOffTypeService.js';

/**
 * GET /api/time-off/types
 * List time off types with search, is_active filter, and pagination
 */
export const getTimeOffTypes = async (req, res, next) => {
  try {
    const result = await timeOffTypeService.getTimeOffTypes(req.query);
    return res.status(200).json({
      success: true,
      message: 'Time off types fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/time-off/types/:id
 * Get single time off type by ID
 */
export const getTimeOffTypeById = async (req, res, next) => {
  try {
    const record = await timeOffTypeService.getTimeOffTypeById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Time off type not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Time off type retrieved successfully',
      data: record
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/time-off/types
 * Create a new time off type
 */
export const createTimeOffType = async (req, res, next) => {
  try {
    const created = await timeOffTypeService.createTimeOffType(req.body);
    return res.status(201).json({
      success: true,
      message: 'Time off type created successfully',
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
 * PUT /api/time-off/types/:id
 * Update an existing time off type
 */
export const updateTimeOffType = async (req, res, next) => {
  try {
    const updated = await timeOffTypeService.updateTimeOffType(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Time off type updated successfully',
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
 * PATCH /api/time-off/types/:id/status
 * Activate or deactivate time off type
 */
export const updateStatus = async (req, res, next) => {
  try {
    const updated = await timeOffTypeService.updateStatus(req.params.id, req.body.is_active);
    return res.status(200).json({
      success: true,
      message: 'Time off type status updated successfully',
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
 * DELETE /api/time-off/types/:id
 * Delete time off type if not referenced
 */
export const deleteTimeOffType = async (req, res, next) => {
  try {
    await timeOffTypeService.deleteTimeOffType(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Time off type deleted successfully'
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
  getTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  updateStatus,
  deleteTimeOffType
};
