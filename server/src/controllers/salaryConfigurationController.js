import salaryConfigurationService from '../services/salaryConfigurationService.js';

// =============================================================================
// SALARY STRUCTURE CONTROLLERS
// =============================================================================

/**
 * GET /api/salary-structures
 * List salary structures with search, active filter, and pagination
 */
export const getStructures = async (req, res) => {
  try {
    const result = await salaryConfigurationService.getStructures(req.query);
    return res.status(200).json({
      success: true,
      message: 'Salary structures retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/salary-structures/:id
 * Get single salary structure with all attached rules ordered by sequence ASC
 */
export const getStructureById = async (req, res) => {
  try {
    const record = await salaryConfigurationService.getStructureById(req.params.id, {
      activeOnly: req.query.active_only === 'true' || req.query.active_only === true
    });
    return res.status(200).json({
      success: true,
      message: 'Salary structure retrieved successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_FETCH_ERROR'
    });
  }
};

/**
 * POST /api/salary-structures
 * Create a new salary structure template
 */
export const createStructure = async (req, res) => {
  try {
    const record = await salaryConfigurationService.createStructure(req.body);
    return res.status(201).json({
      success: true,
      message: 'Salary structure created successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_CREATE_ERROR'
    });
  }
};

/**
 * PUT /api/salary-structures/:id
 * Update an existing salary structure
 */
export const updateStructure = async (req, res) => {
  try {
    const record = await salaryConfigurationService.updateStructure(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Salary structure updated successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_UPDATE_ERROR'
    });
  }
};

/**
 * PATCH /api/salary-structures/:id/status
 * Toggle active/inactive status of salary structure
 */
export const updateStructureStatus = async (req, res) => {
  try {
    const isActive =
      req.body.is_active !== undefined
        ? Boolean(req.body.is_active)
        : true;

    const record = await salaryConfigurationService.updateStructureStatus(req.params.id, isActive);
    return res.status(200).json({
      success: true,
      message: `Salary structure ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_STATUS_ERROR'
    });
  }
};

/**
 * DELETE /api/salary-structures/:id
 * Delete a salary structure (with reference check)
 */
export const deleteStructure = async (req, res) => {
  try {
    await salaryConfigurationService.deleteStructure(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Salary structure deleted successfully'
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_DELETE_ERROR'
    });
  }
};

/**
 * GET /api/salary-structures/:id/rules
 * Get all rules belonging to a specific structure
 */
export const getRulesForStructure = async (req, res) => {
  try {
    // Verify structure exists first
    await salaryConfigurationService.getStructureById(req.params.id);

    const query = { ...req.query, salary_structure_id: req.params.id };
    const result = await salaryConfigurationService.getRules(query);
    return res.status(200).json({
      success: true,
      message: 'Structure salary rules retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'STRUCTURE_RULES_ERROR'
    });
  }
};

/**
 * POST /api/salary-structures/:id/rules
 * Attach a new salary rule directly to a structure
 */
export const createRuleForStructure = async (req, res) => {
  try {
    const ruleData = {
      ...req.body,
      salary_structure_id: Number(req.params.id)
    };
    const record = await salaryConfigurationService.createRule(ruleData);
    return res.status(201).json({
      success: true,
      message: 'Salary rule created and attached to structure successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_CREATE_ERROR'
    });
  }
};

// =============================================================================
// SALARY RULE CONTROLLERS
// =============================================================================

/**
 * GET /api/salary-rules
 * List salary rules with filters and pagination
 */
export const getRules = async (req, res) => {
  try {
    const result = await salaryConfigurationService.getRules(req.query);
    return res.status(200).json({
      success: true,
      message: 'Salary rules retrieved successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_FETCH_ERROR'
    });
  }
};

/**
 * GET /api/salary-rules/:id
 * Get single salary rule by ID
 */
export const getRuleById = async (req, res) => {
  try {
    const record = await salaryConfigurationService.getRuleById(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Salary rule retrieved successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_FETCH_ERROR'
    });
  }
};

/**
 * POST /api/salary-rules
 * Create a new salary rule
 */
export const createRule = async (req, res) => {
  try {
    const record = await salaryConfigurationService.createRule(req.body);
    return res.status(201).json({
      success: true,
      message: 'Salary rule created successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_CREATE_ERROR'
    });
  }
};

/**
 * PUT /api/salary-rules/:id
 * Update an existing salary rule
 */
export const updateRule = async (req, res) => {
  try {
    const record = await salaryConfigurationService.updateRule(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Salary rule updated successfully',
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_UPDATE_ERROR'
    });
  }
};

/**
 * PATCH /api/salary-rules/:id/status
 * Toggle active/inactive status of salary rule
 */
export const updateRuleStatus = async (req, res) => {
  try {
    const isActive =
      req.body.is_active !== undefined
        ? Boolean(req.body.is_active)
        : true;

    const record = await salaryConfigurationService.updateRuleStatus(req.params.id, isActive);
    return res.status(200).json({
      success: true,
      message: `Salary rule ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: record
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_STATUS_ERROR'
    });
  }
};

/**
 * DELETE /api/salary-rules/:id
 * Delete a salary rule (with payslip reference check)
 */
export const deleteRule = async (req, res) => {
  try {
    await salaryConfigurationService.deleteRule(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Salary rule deleted successfully'
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      code: err.code || 'RULE_DELETE_ERROR'
    });
  }
};
