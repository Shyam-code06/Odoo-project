import { db, DepartmentModel, EmployeeModel } from '../models/index.js';

export class DepartmentService {
  /**
   * Get all departments with search, pagination, and sorting
   * @param {object} params
   */
  async getDepartments(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;
    const sortBy = ['id', 'name', 'code', 'created_at'].includes(params.sortBy)
      ? `departments.${params.sortBy}`
      : 'departments.id';
    const sortOrder = (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let baseQuery = db('departments')
      .leftJoin('employees as mgr', 'departments.manager_id', 'mgr.id');

    if (search) {
      baseQuery = baseQuery.where((builder) => {
        builder
          .where('departments.name', 'like', `%${search}%`)
          .orWhere('departments.code', 'like', `%${search}%`);
      });
    }

    // Get total count for pagination
    const countResult = await baseQuery.clone().count('departments.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch paginated records with manager information
    const data = await baseQuery
      .select(
        'departments.id',
        'departments.name',
        'departments.code',
        'departments.description',
        'departments.manager_id',
        'departments.created_at',
        'departments.updated_at',
        db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name"),
        'mgr.employee_code as manager_code',
        'mgr.email as manager_email',
        db.raw('(SELECT COUNT(id) FROM employees WHERE employees.department_id = departments.id) as employee_count'),
        db.raw('(SELECT COUNT(id) FROM job_positions WHERE job_positions.department_id = departments.id) as job_position_count')
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
   * Get department by ID
   * @param {number|string} id
   */
  async getDepartmentById(id) {
    const department = await db('departments')
      .leftJoin('employees as mgr', 'departments.manager_id', 'mgr.id')
      .where('departments.id', id)
      .select(
        'departments.id',
        'departments.name',
        'departments.code',
        'departments.description',
        'departments.manager_id',
        'departments.created_at',
        'departments.updated_at',
        db.raw("CONCAT(mgr.first_name, ' ', mgr.last_name) as manager_name"),
        'mgr.employee_code as manager_code',
        'mgr.email as manager_email',
        db.raw('(SELECT COUNT(id) FROM employees WHERE employees.department_id = departments.id) as employee_count'),
        db.raw('(SELECT COUNT(id) FROM job_positions WHERE job_positions.department_id = departments.id) as job_position_count')
      )
      .first();

    return department || null;
  }

  /**
   * Create a new department
   * @param {object} departmentData
   */
  async createDepartment(departmentData) {
    const { name, code, description, manager_id } = departmentData;

    // 1. Verify code uniqueness
    const existingCode = await DepartmentModel.findOne({ code });
    if (existingCode) {
      const error = new Error('Department code already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_CODE';
      throw error;
    }

    // 2. Verify manager_id if supplied
    if (manager_id) {
      const managerExists = await EmployeeModel.findById(manager_id);
      if (!managerExists) {
        const error = new Error(`Manager employee with ID ${manager_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_MANAGER';
        throw error;
      }
    }

    // 3. Insert record
    const created = await DepartmentModel.create({
      name,
      code,
      description: description || null,
      manager_id: manager_id || null
    });

    return await this.getDepartmentById(created.id);
  }

  /**
   * Update department by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateDepartment(id, updateData) {
    const existing = await DepartmentModel.findById(id);
    if (!existing) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Verify code uniqueness if updating code
    if (updateData.code && updateData.code !== existing.code) {
      const conflict = await db('departments')
        .where({ code: updateData.code })
        .whereNot({ id })
        .first();

      if (conflict) {
        const error = new Error('Department code already exists');
        error.statusCode = 409;
        error.code = 'DUPLICATE_CODE';
        throw error;
      }
    }

    // Verify manager if supplied
    if (updateData.manager_id) {
      const managerExists = await EmployeeModel.findById(updateData.manager_id);
      if (!managerExists) {
        const error = new Error(`Manager employee with ID ${updateData.manager_id} does not exist`);
        error.statusCode = 400;
        error.code = 'INVALID_MANAGER';
        throw error;
      }
    }

    // Do not modify id
    const payload = { ...updateData };
    delete payload.id;

    await DepartmentModel.updateById(id, payload);
    return await this.getDepartmentById(id);
  }

  /**
   * Delete department with reference check protection
   * @param {number|string} id
   */
  async deleteDepartment(id) {
    const existing = await DepartmentModel.findById(id);
    if (!existing) {
      const error = new Error('Department not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in job_positions, employees, contracts
    const [jobPosCount, empCount, contractCount] = await Promise.all([
      db('job_positions').where({ department_id: id }).count('id as total').first(),
      db('employees').where({ department_id: id }).count('id as total').first(),
      db('contracts').where({ department_id: id }).count('id as total').first()
    ]);

    const totalReferences =
      (parseInt(jobPosCount?.total, 10) || 0) +
      (parseInt(empCount?.total, 10) || 0) +
      (parseInt(contractCount?.total, 10) || 0);

    if (totalReferences > 0) {
      const error = new Error('Department cannot be deleted because it is being used by other records.');
      error.statusCode = 409;
      error.code = 'RECORD_REFERENCED';
      throw error;
    }

    await DepartmentModel.deleteById(id);
    return true;
  }
}

export default new DepartmentService();
