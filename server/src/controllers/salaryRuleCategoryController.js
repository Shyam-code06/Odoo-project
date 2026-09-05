import salaryRuleCategoryService from '../services/salaryRuleCategoryService.js';

/**
 * GET /api/salary-rule-categories
 * List salary rule categories with search, pagination, and sorting
 */
export const getSalaryRuleCategories = async (req, res, next) => {
  try {
    const result = await salaryRuleCategoryService.getSalaryRuleCategories(req.query);
    return res.status(200).json({
      success: true,
      message: 'Salary rule categories fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/salary-rule-categories/:id
 * Get single category by ID
 */
export const getSalaryRuleCategoryById = async (req, res, next) => {
  try {
    const category = await salaryRuleCategoryService.getSalaryRuleCategoryById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Salary rule category not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Salary rule category retrieved successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/salary-rule-categories
 * Create a new salary rule category
 */
export const createSalaryRuleCategory = async (req, res, next) => {
  try {
    const created = await salaryRuleCategoryService.createSalaryRuleCategory(req.body);
    return res.status(201).json({
      success: true,
      message: 'Salary rule category created successfully',
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
 * PUT /api/salary-rule-categories/:id
 * Update an existing salary rule category
 */
export const updateSalaryRuleCategory = async (req, res, next) => {
  try {
    const updated = await salaryRuleCategoryService.updateSalaryRuleCategory(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Salary rule category updated successfully',
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
 * DELETE /api/salary-rule-categories/:id
 * Delete salary rule category if not referenced by salary rules
 */
export const deleteSalaryRuleCategory = async (req, res, next) => {
  try {
    await salaryRuleCategoryService.deleteSalaryRuleCategory(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Salary rule category deleted successfully'
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
  getSalaryRuleCategories,
  getSalaryRuleCategoryById,
  createSalaryRuleCategory,
  updateSalaryRuleCategory,
  deleteSalaryRuleCategory
};
