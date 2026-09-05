import {
  db,
  ContractModel,
  EmployeeModel,
  DepartmentModel,
  JobPositionModel,
  WorkingScheduleModel,
  SalaryStructureModel
} from '../models/index.js';

export class ContractService {
  /**
   * Critical Payroll Service Method:
   * Finds the single valid applicable contract for an employee during a payroll period.
   *
   * @param {number|string} employeeId
   * @param {string} periodStart - 'YYYY-MM-DD'
   * @param {string} periodEnd - 'YYYY-MM-DD'
   * @param {import('knex').Knex.Transaction} [trx]
   * @returns {Promise<object>} The matching active contract
   */
  async getApplicableContract(employeeId, periodStart, periodEnd, trx = null) {
    if (!employeeId || !periodStart || !periodEnd) {
      const error = new Error('employeeId, periodStart, and periodEnd are required to resolve applicable contract');
      error.statusCode = 400;
      throw error;
    }

    const query = (trx ? trx('contracts') : db('contracts'))
      .leftJoin('employees', 'contracts.employee_id', 'employees.id')
      .leftJoin('departments', 'contracts.department_id', 'departments.id')
      .leftJoin('job_positions', 'contracts.job_position_id', 'job_positions.id')
      .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
      .leftJoin('working_schedules', 'contracts.working_schedule_id', 'working_schedules.id')
      .where('contracts.employee_id', employeeId)
      .where('contracts.status', 'active')
      .where('contracts.start_date', '<=', periodEnd)
      .andWhere((builder) => {
        builder
          .whereNull('contracts.end_date')
          .orWhere('contracts.end_date', '>=', periodStart);
      })
      .select(
        'contracts.*',
        'employees.employee_code',
        'employees.first_name',
        'employees.last_name',
        'employees.email as employee_email',
        'departments.name as department_name',
        'job_positions.title as job_position_title',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'working_schedules.name as schedule_name'
      );

    const matchingContracts = await query;

    if (!matchingContracts || matchingContracts.length === 0) {
      const error = new Error(
        `No active contract found for employee ID ${employeeId} applicable for payroll period ${periodStart} to ${periodEnd}`
      );
      error.statusCode = 404;
      error.code = 'NO_APPLICABLE_CONTRACT';
      throw error;
    }

    if (matchingContracts.length > 1) {
      const contractNumbers = matchingContracts.map((c) => c.contract_number).join(', ');
      const error = new Error(
        `Multiple overlapping active contracts (${contractNumbers}) found for employee ID ${employeeId} during payroll period ${periodStart} to ${periodEnd}`
      );
      error.statusCode = 409;
      error.code = 'MULTIPLE_OVERLAPPING_CONTRACTS';
      throw error;
    }

    return matchingContracts[0];
  }

  /**
   * Helper to check for overlapping active contracts for the same employee
   * @param {number|string} employeeId
   * @param {string} startDate
   * @param {string|null} endDate
   * @param {number|string|null} excludeContractId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async checkActiveContractOverlap(employeeId, startDate, endDate, excludeContractId = null, trx = null) {
    let query = (trx ? trx('contracts') : db('contracts'))
      .where('employee_id', employeeId)
      .where('status', 'active');

    if (excludeContractId) {
      query = query.whereNot('id', excludeContractId);
    }

    const effectiveEnd = endDate || '9999-12-31';

    query = query.andWhere((builder) => {
      builder.where('start_date', '<=', effectiveEnd).andWhere((inner) => {
        inner.whereNull('end_date').orWhere('end_date', '>=', startDate);
      });
    });

    const overlapping = await query.first();
    return overlapping || null;
  }

  /**
   * List contracts with filtering, search, pagination, and relation joins
   * @param {object} params
   */
  async getContracts(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;

    const sortByAllowed = {
      id: 'contracts.id',
      contract_number: 'contracts.contract_number',
      start_date: 'contracts.start_date',
      end_date: 'contracts.end_date',
      wage: 'contracts.wage',
      status: 'contracts.status',
      created_at: 'contracts.created_at'
    };
    const sortBy = sortByAllowed[params.sortBy] || 'contracts.id';
    const sortOrder = (params.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let query = db('contracts')
      .leftJoin('employees', 'contracts.employee_id', 'employees.id')
      .leftJoin('departments', 'contracts.department_id', 'departments.id')
      .leftJoin('job_positions', 'contracts.job_position_id', 'job_positions.id')
      .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
      .leftJoin('working_schedules', 'contracts.working_schedule_id', 'working_schedules.id');

    // Filters
    if (params.employee_id) {
      query = query.where('contracts.employee_id', params.employee_id);
    }

    if (params.department_id) {
      query = query.where('contracts.department_id', params.department_id);
    }

    if (params.job_position_id) {
      query = query.where('contracts.job_position_id', params.job_position_id);
    }

    if (params.working_schedule_id) {
      query = query.where('contracts.working_schedule_id', params.working_schedule_id);
    }

    if (params.salary_structure_id) {
      query = query.where('contracts.salary_structure_id', params.salary_structure_id);
    }

    if (params.status) {
      query = query.where('contracts.status', params.status);
    }

    if (params.employment_type) {
      query = query.where('contracts.employment_type', params.employment_type);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .where('contracts.contract_number', 'like', `%${search}%`)
          .orWhere('employees.first_name', 'like', `%${search}%`)
          .orWhere('employees.last_name', 'like', `%${search}%`)
          .orWhere('employees.employee_code', 'like', `%${search}%`);
      });
    }

    const countResult = await query.clone().count('contracts.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const data = await query
      .select(
        'contracts.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'departments.name as department_name',
        'job_positions.title as job_position_title',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'working_schedules.name as schedule_name'
      )
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  /**
   * Get single contract with comprehensive relation metadata
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async getContractById(id, trx = null) {
    const contract = await (trx ? trx('contracts') : db('contracts'))
      .leftJoin('employees', 'contracts.employee_id', 'employees.id')
      .leftJoin('departments', 'contracts.department_id', 'departments.id')
      .leftJoin('job_positions', 'contracts.job_position_id', 'job_positions.id')
      .leftJoin('salary_structures', 'contracts.salary_structure_id', 'salary_structures.id')
      .leftJoin('working_schedules', 'contracts.working_schedule_id', 'working_schedules.id')
      .where('contracts.id', id)
      .select(
        'contracts.*',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code',
        'employees.email as employee_email',
        'departments.name as department_name',
        'job_positions.title as job_position_title',
        'salary_structures.name as salary_structure_name',
        'salary_structures.code as salary_structure_code',
        'working_schedules.name as schedule_name'
      )
      .first();

    return contract || null;
  }

  /**
   * Create a new contract with full integrity and overlap validations
   * @param {object} payload
   */
  async createContract(payload) {
    const {
      employee_id,
      contract_number,
      start_date,
      end_date = null,
      department_id = null,
      job_position_id = null,
      working_schedule_id = null,
      salary_structure_id = null,
      wage,
      employment_type = 'full_time',
      status = 'draft'
    } = payload;

    return await db.transaction(async (trx) => {
      // 1. Verify Employee exists
      const employee = await trx('employees').where('id', employee_id).first();
      if (!employee) {
        const error = new Error(`Employee with ID ${employee_id} does not exist`);
        error.statusCode = 404;
        throw error;
      }

      // 2. Verify optional foreign keys
      if (department_id) {
        const dept = await trx('departments').where('id', department_id).first();
        if (!dept) {
          const error = new Error(`Department with ID ${department_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      if (job_position_id) {
        const pos = await trx('job_positions').where('id', job_position_id).first();
        if (!pos) {
          const error = new Error(`Job position with ID ${job_position_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      if (working_schedule_id) {
        const schedule = await trx('working_schedules').where('id', working_schedule_id).first();
        if (!schedule) {
          const error = new Error(`Working schedule with ID ${working_schedule_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      if (salary_structure_id) {
        const structure = await trx('salary_structures').where('id', salary_structure_id).first();
        if (!structure) {
          const error = new Error(`Salary structure with ID ${salary_structure_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      // 3. Resolve contract number
      let finalContractNumber = contract_number ? contract_number.trim() : null;
      if (finalContractNumber) {
        const existingNum = await trx('contracts').where('contract_number', finalContractNumber).first();
        if (existingNum) {
          const error = new Error(`Contract number '${finalContractNumber}' is already in use`);
          error.statusCode = 409;
          throw error;
        }
      } else {
        const year = new Date(start_date).getFullYear() || new Date().getFullYear();
        const rand = Math.floor(1000 + Math.random() * 9000);
        finalContractNumber = `CNT-${year}-${employee.employee_code || employee_id}-${rand}`;
      }

      // 4. Overlap check if creating with active status
      if (status === 'active') {
        const overlapping = await this.checkActiveContractOverlap(employee_id, start_date, end_date, null, trx);
        if (overlapping) {
          const error = new Error(
            `Cannot create active contract: Employee already has an active contract (${overlapping.contract_number}) overlapping with period ${start_date} to ${end_date || 'indefinite'}. Please expire or adjust the existing active contract first.`
          );
          error.statusCode = 409;
          error.code = 'ACTIVE_CONTRACT_OVERLAP';
          throw error;
        }
      }

      // 5. Insert contract
      const [newId] = await trx('contracts').insert({
        employee_id,
        contract_number: finalContractNumber,
        start_date,
        end_date: end_date || null,
        department_id: department_id || employee.department_id || null,
        job_position_id: job_position_id || employee.job_position_id || null,
        working_schedule_id: working_schedule_id || employee.working_schedule_id || null,
        salary_structure_id: salary_structure_id || null,
        wage: parseFloat(wage),
        employment_type,
        status
      });

      return await this.getContractById(newId, trx);
    });
  }

  /**
   * Update an existing contract
   * @param {number|string} id
   * @param {object} payload
   */
  async updateContract(id, payload) {
    const existing = await ContractModel.findById(id);
    if (!existing) {
      const error = new Error('Contract not found');
      error.statusCode = 404;
      throw error;
    }

    return await db.transaction(async (trx) => {
      const employeeId = payload.employee_id || existing.employee_id;
      const startDate = payload.start_date || existing.start_date;
      const endDate = payload.end_date !== undefined ? payload.end_date : existing.end_date;
      const newStatus = payload.status || existing.status;

      // Verify foreign keys if being updated
      if (payload.department_id) {
        const dept = await trx('departments').where('id', payload.department_id).first();
        if (!dept) {
          const error = new Error(`Department with ID ${payload.department_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      if (payload.job_position_id) {
        const pos = await trx('job_positions').where('id', payload.job_position_id).first();
        if (!pos) {
          const error = new Error(`Job position with ID ${payload.job_position_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      if (payload.working_schedule_id) {
        const schedule = await trx('working_schedules').where('id', payload.working_schedule_id).first();
        if (!schedule) {
          const error = new Error(`Working schedule with ID ${payload.working_schedule_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      if (payload.salary_structure_id) {
        const structure = await trx('salary_structures').where('id', payload.salary_structure_id).first();
        if (!structure) {
          const error = new Error(`Salary structure with ID ${payload.salary_structure_id} does not exist`);
          error.statusCode = 404;
          throw error;
        }
      }

      // Check contract number uniqueness if changed
      if (payload.contract_number && payload.contract_number.trim() !== existing.contract_number) {
        const numExists = await trx('contracts')
          .where('contract_number', payload.contract_number.trim())
          .whereNot('id', id)
          .first();

        if (numExists) {
          const error = new Error(`Contract number '${payload.contract_number.trim()}' is already in use`);
          error.statusCode = 409;
          throw error;
        }
      }

      // Overlap check if contract is/becomes active
      if (newStatus === 'active') {
        const overlapping = await this.checkActiveContractOverlap(employeeId, startDate, endDate, id, trx);
        if (overlapping) {
          const error = new Error(
            `Cannot update contract to active: Employee already has another active contract (${overlapping.contract_number}) overlapping with period ${startDate} to ${endDate || 'indefinite'}.`
          );
          error.statusCode = 409;
          error.code = 'ACTIVE_CONTRACT_OVERLAP';
          throw error;
        }
      }

      const updateData = {};
      if (payload.contract_number) updateData.contract_number = payload.contract_number.trim();
      if (payload.start_date) updateData.start_date = payload.start_date;
      if (payload.end_date !== undefined) updateData.end_date = payload.end_date || null;
      if (payload.department_id !== undefined) updateData.department_id = payload.department_id || null;
      if (payload.job_position_id !== undefined) updateData.job_position_id = payload.job_position_id || null;
      if (payload.working_schedule_id !== undefined) updateData.working_schedule_id = payload.working_schedule_id || null;
      if (payload.salary_structure_id !== undefined) updateData.salary_structure_id = payload.salary_structure_id || null;
      if (payload.wage !== undefined) updateData.wage = parseFloat(payload.wage);
      if (payload.employment_type) updateData.employment_type = payload.employment_type;
      if (payload.status) updateData.status = payload.status;
      updateData.updated_at = trx.fn.now();

      await trx('contracts').where('id', id).update(updateData);

      return await this.getContractById(id, trx);
    });
  }

  /**
   * Patch contract status
   * @param {number|string} id
   * @param {string} status
   */
  async updateContractStatus(id, status) {
    const existing = await ContractModel.findById(id);
    if (!existing) {
      const error = new Error('Contract not found');
      error.statusCode = 404;
      throw error;
    }

    if (status === 'active' && existing.status !== 'active') {
      const overlapping = await this.checkActiveContractOverlap(
        existing.employee_id,
        existing.start_date,
        existing.end_date,
        id
      );

      if (overlapping) {
        const error = new Error(
          `Cannot activate contract: Employee already has an active contract (${overlapping.contract_number}) covering this period.`
        );
        error.statusCode = 409;
        error.code = 'ACTIVE_CONTRACT_OVERLAP';
        throw error;
      }
    }

    await db('contracts').where('id', id).update({
      status,
      updated_at: db.fn.now()
    });

    return await this.getContractById(id);
  }
}

export default new ContractService();
