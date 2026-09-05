import employeeService from '../services/employeeService.js';

/**
 * GET /api/employees
 * List employees with search, multi-field filters, and pagination
 */
export const getEmployees = async (req, res, next) => {
  try {
    const result = await employeeService.getEmployees(req.query);
    return res.status(200).json({
      success: true,
      message: 'Employees fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/employees/:id
 * Get single employee by ID with related summary metrics
 */
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Employee fetched successfully',
      data: employee
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/employees
 * Create a new employee
 */
export const createEmployee = async (req, res, next) => {
  try {
    const created = await employeeService.createEmployee(req.body);
    return res.status(201).json({
      success: true,
      message: 'Employee created successfully',
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
 * PUT /api/employees/:id
 * Update an existing employee
 */
export const updateEmployee = async (req, res, next) => {
  try {
    const updated = await employeeService.updateEmployee(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Employee updated successfully',
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
 * PATCH /api/employees/:id/status
 * Update employee employment status
 */
export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const updated = await employeeService.updateEmployeeStatus(
      req.params.id,
      req.body.employment_status
    );
    return res.status(200).json({
      success: true,
      message: 'Employee status updated successfully',
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
 * DELETE /api/employees/:id
 * Delete employee if no historical records exist
 */
export const deleteEmployee = async (req, res, next) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Employee deleted successfully'
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
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee
};
