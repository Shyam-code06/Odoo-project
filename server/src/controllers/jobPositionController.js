import jobPositionService from '../services/jobPositionService.js';

/**
 * GET /api/job-positions
 * List job positions with optional department filter, search, and pagination
 */
export const getJobPositions = async (req, res, next) => {
  try {
    const result = await jobPositionService.getJobPositions(req.query);
    return res.status(200).json({
      success: true,
      message: 'Job positions fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/job-positions/:id
 * Get single job position by ID
 */
export const getJobPositionById = async (req, res, next) => {
  try {
    const position = await jobPositionService.getJobPositionById(req.params.id);
    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Job position not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Job position retrieved successfully',
      data: position
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/job-positions
 * Create a new job position
 */
export const createJobPosition = async (req, res, next) => {
  try {
    const position = await jobPositionService.createJobPosition(req.body);
    return res.status(201).json({
      success: true,
      message: 'Job position created successfully',
      data: position
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
 * PUT /api/job-positions/:id
 * Update an existing job position
 */
export const updateJobPosition = async (req, res, next) => {
  try {
    const position = await jobPositionService.updateJobPosition(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Job position updated successfully',
      data: position
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
 * DELETE /api/job-positions/:id
 * Delete job position if not referenced
 */
export const deleteJobPosition = async (req, res, next) => {
  try {
    await jobPositionService.deleteJobPosition(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Job position deleted successfully'
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
  getJobPositions,
  getJobPositionById,
  createJobPosition,
  updateJobPosition,
  deleteJobPosition
};
