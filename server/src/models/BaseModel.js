import db from '../config/db.js';

/**
 * Base Model Class for Knex.js
 * Provides generic CRUD operations, pagination, filtering, joins, and transaction support.
 */
export class BaseModel {
  /**
   * @param {string} tableName - Name of the database table
   * @param {string} primaryKey - Primary key column name (default 'id')
   */
  constructor(tableName, primaryKey = 'id') {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.db = db;
  }

  /**
   * Get query builder instance (optional transaction support)
   * @param {import('knex').Knex.Transaction} [trx]
   */
  query(trx = null) {
    return trx ? trx(this.tableName) : this.db(this.tableName);
  }

  /**
   * Find all records with optional filters, pagination, and sorting
   * @param {object} [filter={}] - Filter key-values
   * @param {object} [options={}] - Options (page, limit, orderBy, orderDir, select)
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findAll(filter = {}, options = {}, trx = null) {
    const {
      page,
      limit,
      orderBy = `${this.tableName}.${this.primaryKey}`,
      orderDir = 'desc',
      select = [`${this.tableName}.*`],
    } = options;

    let q = this.query(trx).select(select);

    // Apply where filters
    if (Object.keys(filter).length > 0) {
      q = q.where(filter);
    }

    // Apply sorting
    if (orderBy) {
      q = q.orderBy(orderBy, orderDir);
    }

    // Apply pagination if specified
    if (page && limit) {
      const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      q = q.limit(parseInt(limit, 10)).offset(offset);
    } else if (limit) {
      q = q.limit(parseInt(limit, 10));
    }

    return await q;
  }

  /**
   * Find single record by primary key
   * @param {number|string} id
   * @param {string[]} [select=['*']]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findById(id, select = [`${this.tableName}.*`], trx = null) {
    return await this.query(trx)
      .where({ [`${this.tableName}.${this.primaryKey}`]: id })
      .select(select)
      .first();
  }

  /**
   * Find single record matching condition
   * @param {object} filter
   * @param {string[]} [select=['*']]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findOne(filter = {}, select = [`${this.tableName}.*`], trx = null) {
    return await this.query(trx)
      .where(filter)
      .select(select)
      .first();
  }

  /**
   * Count records matching filter
   * @param {object} [filter={}]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async count(filter = {}, trx = null) {
    const result = await this.query(trx).where(filter).count(`${this.primaryKey} as total`).first();
    return result ? parseInt(result.total, 10) : 0;
  }

  /**
   * Insert a new record
   * @param {object} data
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async create(data, trx = null) {
    const [insertedId] = await this.query(trx).insert(data);
    return await this.findById(insertedId || data[this.primaryKey], ['*'], trx);
  }

  /**
   * Bulk insert records
   * @param {object[]} dataArray
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async createMany(dataArray, trx = null) {
    if (!dataArray || dataArray.length === 0) return [];
    return await this.query(trx).insert(dataArray);
  }

  /**
   * Update record by primary key
   * @param {number|string} id
   * @param {object} data
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async updateById(id, data, trx = null) {
    const updatePayload = { ...data };
    // Don't modify primary key
    delete updatePayload[this.primaryKey];

    const affected = await this.query(trx)
      .where({ [this.primaryKey]: id })
      .update(updatePayload);

    if (affected === 0) return null;
    return await this.findById(id, ['*'], trx);
  }

  /**
   * Update records matching condition
   * @param {object} filter
   * @param {object} data
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async update(filter, data, trx = null) {
    return await this.query(trx).where(filter).update(data);
  }

  /**
   * Delete record by primary key
   * @param {number|string} id
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async deleteById(id, trx = null) {
    return await this.query(trx).where({ [this.primaryKey]: id }).del();
  }

  /**
   * Delete records matching filter
   * @param {object} filter
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async delete(filter, trx = null) {
    return await this.query(trx).where(filter).del();
  }

  /**
   * Execute an operation inside a Knex transaction
   * @param {(trx: import('knex').Knex.Transaction) => Promise<any>} callback
   */
  async transaction(callback) {
    return await this.db.transaction(callback);
  }
}

export default BaseModel;
