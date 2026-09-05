import { db, JobPositionModel, DepartmentModel } from '../models/index.js';

export class JobPositionService {
  /**
   * Get job positions with search, department filter, pagination, and sorting
   * @param {object} params
   */
  async getJobPositions(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;
    const departmentId = params.department_id ? Number(params.department_id) : null;
    const sortBy = ['id', 'title', 'code', 'created_at'].includes(params.sortBy)
      ? `job_positions.${params.sortBy}`
      : 'job_positions.id';
    const sortOrder = (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let baseQuery = db('job_positions')
      .leftJoin('departments', 'job_positions.department_id', 'departments.id');

    if (departmentId) {
      baseQuery = baseQuery.where('job_positions.department_id', departmentId);
    }

    if (search) {
      baseQuery = baseQuery.where((builder) => {
        builder
          .where('job_positions.title', 'like', `%${search}%`)
          .orWhere('job_positions.code', 'like', `%${search}%`);
      });
    }

    const countResult = await baseQuery.clone().count('job_positions.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const data = await baseQuery
      .select(
        'job_positions.id',
        'job_positions.title',
        'job_positions.code',
        'job_positions.description',
        'job_positions.department_id',
        'job_positions.created_at',
        'job_positions.updated_at',
        'departments.name as department_name',
        'departments.code as department_code',
        db.raw('(SELECT COUNT(id) FROM employees WHERE employees.job_position_id = job_positions.id) as employee_count')
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
   * Get job position by ID
   * @param {number|string} id
   */
  async getJobPositionById(id) {
    const position = await db('job_positions')
      .leftJoin('departments', 'job_positions.department_id', 'departments.id')
      .where('job_positions.id', id)
      .select(
        'job_positions.id',
        'job_positions.title',
        'job_positions.code',
        'job_positions.description',
        'job_positions.department_id',
        'job_positions.created_at',
        'job_positions.updated_at',
        'departments.name as department_name',
        'departments.code as department_code',
        db.raw('(SELECT COUNT(id) FROM employees WHERE employees.job_position_id = job_positions.id) as employee_count')
      )
      .first();

    return position || null;
  }

  /**
   * Create a new job position
   * @param {object} positionData
   */
  async createJobPosition(positionData) {
    const { title, code, department_id, description } = positionData;

    // 1. Verify department exists
    const departmentExists = await DepartmentModel.findById(department_id);
    if (!departmentExists) {
      const error = new Error(`Referenced department with ID ${department_id} does not exist`);
      error.statusCode = 400;
      error.code = 'INVALID_DEPARTMENT';
      throw error;
    }

    // 2. Verify code uniqueness
    const existingCode = await JobPositionModel.findOne({ code });
    if (existingCode) {
      const error = new Error('Job position code already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_CODE';
      throw error;
    }

    // 3. Insert record
    const created = await JobPositionModel.create({
      title,
      code,
      department_id,
      description: description || null
    });

    return await this.getJobPositionById(created.id);
  }

  /**
   * Update job position by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateJobPosition(id, updateData) {
    const existing = await JobPositionModel.findById(id);
    if (!existing) {
      const error = new Error('Job position not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Verify department if updated
    if (updateData.department_id) {
      const departmentExists = await DepartmentModel.findById(updateData.department_id);
      if (!departmentExists) {
        const error = new Error(`Referenced department with ID ${updateData.department_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_DEPARTMENT';
        throw error;
      }
    }

    // Verify code uniqueness if updating code
    if (updateData.code && updateData.code !== existing.code) {
      const conflict = await db('job_positions')
        .where({ code: updateData.code })
        .whereNot({ id })
        .first();

      if (conflict) {
        const error = new Error('Job position code already exists');
        error.statusCode = 409;
        error.code = 'DUPLICATE_CODE';
        throw error;
      }
    }

    const payload = { ...updateData };
    delete payload.id;

    await JobPositionModel.updateById(id, payload);
    return await this.getJobPositionById(id);
  }

  /**
   * Delete job position with reference check protection
   * @param {number|string} id
   */
  async deleteJobPosition(id) {
    const existing = await JobPositionModel.findById(id);
    if (!existing) {
      const error = new Error('Job position not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in employees and contracts
    const [empCount, contractCount] = await Promise.all([
      db('employees').where({ job_position_id: id }).count('id as total').first(),
      db('contracts').where({ job_position_id: id }).count('id as total').first()
    ]);

    const totalReferences =
      (parseInt(empCount?.total, 10) || 0) +
      (parseInt(contractCount?.total, 10) || 0);

    if (totalReferences > 0) {
      const error = new Error('Job position cannot be deleted because it is being used by other records.');
      error.statusCode = 409;
      error.code = 'RECORD_REFERENCED';
      throw error;
    }

    await JobPositionModel.deleteById(id);
    return true;
  }
}

export default new JobPositionService();
