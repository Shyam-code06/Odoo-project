import BaseModel from './BaseModel.js';

export class RefreshTokenModel extends BaseModel {
  constructor() {
    super('refresh_tokens', 'id');
  }

  /**
   * Find an active (non-revoked & non-expired) refresh token by its hash
   * @param {string} tokenHash
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async findByTokenHash(tokenHash, trx = null) {
    return await this.query(trx)
      .where('token_hash', tokenHash)
      .first();
  }

  /**
   * Revoke a refresh token by hash, optionally recording the replacing token hash
   * @param {string} tokenHash
   * @param {string|null} [replacedByHash=null]
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async revokeToken(tokenHash, replacedByHash = null, trx = null) {
    return await this.query(trx)
      .where('token_hash', tokenHash)
      .update({
        is_revoked: true,
        revoked_at: this.db.fn.now(),
        replaced_by_hash: replacedByHash,
        updated_at: this.db.fn.now()
      });
  }

  /**
   * Revoke all refresh tokens belonging to a specific user (useful on password reset or security breach)
   * @param {number|string} userId
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async revokeAllUserTokens(userId, trx = null) {
    return await this.query(trx)
      .where('user_id', userId)
      .andWhere('is_revoked', false)
      .update({
        is_revoked: true,
        revoked_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      });
  }

  /**
   * Delete tokens that have already expired or been revoked for longer than retention
   * @param {import('knex').Knex.Transaction} [trx]
   */
  async cleanExpired(trx = null) {
    return await this.query(trx)
      .where('expires_at', '<', this.db.fn.now())
      .del();
  }
}

export default new RefreshTokenModel();
