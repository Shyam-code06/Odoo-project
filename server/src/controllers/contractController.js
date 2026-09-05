import contractService from '../services/contractService.js';

/**
 * GET /api/contracts
 * List contracts with filtering and pagination
 */
export const getContracts = async (req, res, next) => {
  try {
    const result = await contractService.getContracts(req.query);
    return res.status(200).json({
      success: true,
      message: 'Contracts fetched successfully',
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/contracts/:id
 * Get single contract by ID with complete relations
 */
export const getContractById = async (req, res, next) => {
  try {
    const contract = await contractService.getContractById(req.params.id);
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Contract fetched successfully',
      data: contract
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/contracts/applicable
 * Query applicable contract for an employee within a period (Payroll helper)
 */
export const getApplicableContract = async (req, res, next) => {
  try {
    const { employee_id, period_start, period_end } = req.query;
    const contract = await contractService.getApplicableContract(
      employee_id,
      period_start,
      period_end
    );

    return res.status(200).json({
      success: true,
      message: 'Applicable contract resolved successfully',
      data: contract
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * POST /api/contracts
 * Create a new contract
 */
export const createContract = async (req, res, next) => {
  try {
    const created = await contractService.createContract(req.body);
    return res.status(201).json({
      success: true,
      message: 'Contract created successfully',
      data: created
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PUT /api/contracts/:id
 * Update an existing contract
 */
export const updateContract = async (req, res, next) => {
  try {
    const updated = await contractService.updateContract(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Contract updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * PATCH /api/contracts/:id/status
 * Update contract status
 */
export const updateContractStatus = async (req, res, next) => {
  try {
    const updated = await contractService.updateContractStatus(
      req.params.id,
      req.body.status
    );
    return res.status(200).json({
      success: true,
      message: 'Contract status updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        code: error.code,
        message: error.message
      });
    }
    next(error);
  }
};

export default {
  getContracts,
  getContractById,
  getApplicableContract,
  createContract,
  updateContract,
  updateContractStatus
};
