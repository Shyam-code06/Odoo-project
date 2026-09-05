import { db } from './db.js';
import { ROLES_DATA } from './rbacConstants.js';
import { hashPassword } from '../utils/password.js';

/**
 * Idempotently seed the 5 standard system roles and default Admin user
 */
export async function seedRbac() {
  await db.transaction(async (trx) => {
    // 1. Seed standard roles
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

    // 2. Seed default Admin user: admin@gmail.com / admin123
    const adminRole = await trx('roles')
      .where('code', 'ADMIN')
      .orWhere('name', 'Admin')
      .first();

    if (adminRole) {
      const existingAdmin = await trx('users')
        .where('email', 'admin@gmail.com')
        .first();

      const passwordHash = await hashPassword('admin123');

      if (existingAdmin) {
        await trx('users')
          .where('id', existingAdmin.id)
          .update({
            role_id: adminRole.id,
            password_hash: passwordHash,
            is_active: true,
            updated_at: trx.fn.now()
          });
      } else {
        await trx('users').insert({
          email: 'admin@gmail.com',
          password_hash: passwordHash,
          role_id: adminRole.id,
          is_active: true
        });
      }
      console.log('✅ Default Admin user (admin@gmail.com) seeded successfully!');
    }
  });

  console.log('✅ Standard roles seeded successfully!');
}

export default seedRbac;
