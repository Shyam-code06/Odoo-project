import { db, UserModel, RoleModel, EmployeeModel } from '../models/index.js';
import { hashPassword } from '../utils/password.js';

/**
 * GET /api/users
 * List all users with role and linked employee details
 */
export const getUsers = async (req, res) => {
  try {
    const users = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .select(
        'users.id',
        'users.email',
        'users.role_id',
        'users.employee_id',
        'users.is_active',
        'users.created_at',
        'users.updated_at',
        'roles.name as role_name',
        'roles.code as role_code',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code'
      )
      .orderBy('users.id', 'desc');

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /api/users/roles
 * List all available roles in database
 */
export const getRoles = async (req, res) => {
  try {
    const roles = await db('roles')
      .select('id', 'name', 'code', 'description')
      .orderBy('id', 'asc');

    return res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * POST /api/users
 * Admin creates user with email, password, and assigned role
 */
export const createUser = async (req, res) => {
  try {
    const { email, password, role_id, employee_id } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.',
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    if (!role_id) {
      return res.status(400).json({
        success: false,
        message: 'A system role must be selected.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if email already exists
    const existing = await UserModel.findByEmail(cleanEmail);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A user account with this email already exists.',
      });
    }

    // Verify role exists in database
    const role = await RoleModel.findById(role_id);
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Selected role does not exist.',
      });
    }

    // Verify employee if provided
    if (employee_id) {
      const emp = await EmployeeModel.findById(employee_id);
      if (!emp) {
        return res.status(404).json({
          success: false,
          message: 'Selected employee record not found.',
        });
      }
    }

    // Hash password with bcrypt
    const password_hash = await hashPassword(password);

    // Insert user
    const [newId] = await db('users').insert({
      email: cleanEmail,
      password_hash,
      role_id: Number(role_id),
      employee_id: employee_id ? Number(employee_id) : null,
      is_active: 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    });

    const createdUser = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .where('users.id', newId)
      .select(
        'users.id',
        'users.email',
        'users.role_id',
        'users.employee_id',
        'users.is_active',
        'users.created_at',
        'roles.name as role_name',
        'roles.code as role_code',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code'
      )
      .first();

    return res.status(201).json({
      success: true,
      message: 'User created successfully. They can now log in with their credentials.',
      data: createdUser,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * PUT /api/users/:id
 * Update user details (role, active status, employee link, or password)
 */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role_id, is_active, employee_id, password } = req.body;

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const updates = { updated_at: db.fn.now() };

    if (role_id !== undefined) {
      const role = await RoleModel.findById(role_id);
      if (!role) {
        return res.status(400).json({
          success: false,
          message: 'Selected role does not exist.',
        });
      }
      updates.role_id = Number(role_id);
    }

    if (is_active !== undefined) {
      updates.is_active = is_active ? 1 : 0;
    }

    if (employee_id !== undefined) {
      updates.employee_id = employee_id ? Number(employee_id) : null;
    }

    if (password && password.trim().length >= 6) {
      updates.password_hash = await hashPassword(password.trim());
    }

    await db('users').where({ id }).update(updates);

    const updated = await db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .leftJoin('employees', 'users.employee_id', 'employees.id')
      .where('users.id', id)
      .select(
        'users.id',
        'users.email',
        'users.role_id',
        'users.employee_id',
        'users.is_active',
        'users.created_at',
        'roles.name as role_name',
        'roles.code as role_code',
        'employees.first_name',
        'employees.last_name',
        'employees.employee_code'
      )
      .first();

    return res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE /api/users/:id
 * Delete user account
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user && String(req.user.id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account while logged in.',
      });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    await db('refresh_tokens').where({ user_id: id }).del();
    await db('users').where({ id }).del();

    return res.status(200).json({
      success: true,
      message: 'User account removed successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
