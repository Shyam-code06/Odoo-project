import { db } from './db.js';
import { ROLES_DATA } from './rbacConstants.js';

/**
 * Idempotently seed the 5 standard system roles into the roles table
 */
export async function seedRbac() {
  await db.transaction(async (trx) => {
    for (const role of ROLES_DATA) {
      const existing = await trx('roles')
        .where('code', role.code)
        .orWhere('name', role.name)
        .first();

      if (existing) {
        await trx('roles')
          .where('id', existing.id)
          .update({
            code: role.code,
            name: role.name,
            description: role.description,
            updated_at: trx.fn.now()
          });
      } else {
        await trx('roles').insert({
          code: role.code,
          name: role.name,
          description: role.description
        });
      }
    }
  });

  console.log('✅ Standard roles seeded successfully!');
}

export default seedRbac;
