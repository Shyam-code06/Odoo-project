import { db, TimeOffTypeModel } from '../models/index.js';

export class TimeOffTypeService {
  /**
   * Get time off types with search, is_active filter, pagination, and sorting
   * @param {object} params
   */
  async getTimeOffTypes(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const offset = (page - 1) * limit;
    const search = params.search ? params.search.trim() : null;
    const isActive =
      params.is_active !== undefined && params.is_active !== ''
        ? params.is_active === 'true' || params.is_active === true || params.is_active === '1'
        : null;
    const sortBy = ['id', 'name', 'code', 'unit', 'created_at'].includes(params.sortBy)
      ? `time_off_types.${params.sortBy}`
      : 'time_off_types.id';
    const sortOrder = (params.sortOrder || params.orderDir || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let baseQuery = db('time_off_types');

    if (isActive !== null) {
      baseQuery = baseQuery.where('time_off_types.is_active', isActive);
    }

    if (search) {
      baseQuery = baseQuery.where((builder) => {
        builder
          .where('time_off_types.name', 'like', `%${search}%`)
          .orWhere('time_off_types.code', 'like', `%${search}%`);
      });
    }

    const countResult = await baseQuery.clone().count('time_off_types.id as total').first();
    const total = countResult ? parseInt(countResult.total, 10) : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const data = await baseQuery
      .select('time_off_types.*')
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
   * Get time off type by ID
   * @param {number|string} id
   */
  async getTimeOffTypeById(id) {
    const record = await TimeOffTypeModel.findById(id);
    return record || null;
  }

  /**
   * Create a new time off type
   * @param {object} typeData
   */
  async createTimeOffType(typeData) {
    const { name, code, unit, requires_allocation, requires_approval, is_paid, is_active } = typeData;

    // 1. Verify code uniqueness
    const existingCode = await TimeOffTypeModel.findOne({ code });
    if (existingCode) {
      const error = new Error('Time off type code already exists');
      error.statusCode = 409;
      error.code = 'DUPLICATE_CODE';
      throw error;
    }

    // 2. Insert record
    const created = await TimeOffTypeModel.create({
      name,
      code,
      unit,
      requires_allocation,
      requires_approval,
      is_paid,
      is_active
    });

    return created;
  }

  /**
   * Update time off type by ID
   * @param {number|string} id
   * @param {object} updateData
   */
  async updateTimeOffType(id, updateData) {
    const existing = await TimeOffTypeModel.findById(id);
    if (!existing) {
      const error = new Error('Time off type not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Verify code uniqueness if updating code
    if (updateData.code && updateData.code !== existing.code) {
      const conflict = await db('time_off_types')
        .where({ code: updateData.code })
        .whereNot({ id })
        .first();

      if (conflict) {
        const error = new Error('Time off type code already exists');
        error.statusCode = 409;
        error.code = 'DUPLICATE_CODE';
        throw error;
      }
    }

    const payload = { ...updateData };
    delete payload.id;

    const updated = await TimeOffTypeModel.updateById(id, payload);
    return updated;
  }

  /**
   * Update status (active/inactive)
   * @param {number|string} id
   * @param {boolean} isActive
   */
  async updateStatus(id, isActive) {
    const existing = await TimeOffTypeModel.findById(id);
    if (!existing) {
      const error = new Error('Time off type not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updated = await TimeOffTypeModel.updateById(id, { is_active: Boolean(isActive) });
    return updated;
  }

  /**
   * Delete time off type with reference check protection
   * @param {number|string} id
   */
  async deleteTimeOffType(id) {
    const existing = await TimeOffTypeModel.findById(id);
    if (!existing) {
      const error = new Error('Time off type not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Check references in time_off_allocations and time_off_requests
    const [allocCount, reqCount] = await Promise.all([
      db('time_off_allocations').where({ time_off_type_id: id }).count('id as total').first(),
      db('time_off_requests').where({ time_off_type_id: id }).count('id as total').first()
    ]);

    const totalReferences =
      (parseInt(allocCount?.total, 10) || 0) +
      (parseInt(reqCount?.total, 10) || 0);

    if (totalReferences > 0) {
      const error = new Error('Time off type cannot be deleted because it is being used by other records.');
      error.statusCode = 409;
      error.code = 'RECORD_REFERENCED';
      throw error;
    }

    await TimeOffTypeModel.deleteById(id);
    return true;
  }
}

export default new TimeOffTypeService();
