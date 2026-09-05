import React, { useState, useEffect, useMemo } from 'react';
import {
  UserPlus,
  Search,
  Shield,
  UserCheck,
  UserX,
  Mail,
  Lock,
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/Toast';
import { userService } from '../../services/userService';
import { employeeService } from '../../services/employeeService';
import { useAuth } from '../../contexts/AuthContext';

const getRoleBadgeVariant = (roleName = '') => {
  const r = roleName.toLowerCase();
  if (r.includes('admin')) return 'danger';
  if (r.includes('payroll manager')) return 'warning';
  if (r.includes('payroll')) return 'info';
  if (r.includes('hr manager')) return 'primary';
  if (r.includes('employee')) return 'success';
  return 'neutral';
};

export const UserManagementPage = () => {
  const toast = useToast();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role_id: '',
    employee_id: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Load real users, roles, and employees from MySQL database
  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes, empRes] = await Promise.all([
        userService.getUsers(),
        userService.getRoles(),
        employeeService.getEmployees({ limit: 100 }),
      ]);

      if (usersRes.success) {
        setUsers(usersRes.data || []);
      }
      if (rolesRes.success) {
        setRoles(rolesRes.data || []);
        if (rolesRes.data?.length > 0 && !formData.role_id) {
          // Default to HR Manager or first role
          const hrm = rolesRes.data.find((r) => r.name === 'HR Manager') || rolesRes.data[0];
          setFormData((prev) => ({ ...prev, role_id: String(hrm.id) }));
        }
      }
      if (empRes?.data) {
        setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
      }
    } catch (err) {
      toast.error('Failed to load system users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        u.email?.toLowerCase().includes(q) ||
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.role_name?.toLowerCase().includes(q);

      const matchRole = !roleFilter || String(u.role_id) === String(roleFilter);

      return matchSearch && matchRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Open Create Modal
  const handleOpenModal = () => {
    const defaultRole = roles.find((r) => r.name === 'HR Manager') || roles[0];
    setFormData({
      email: '',
      password: '',
      role_id: defaultRole ? String(defaultRole.id) : '',
      employee_id: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (!formData.role_id) {
      errors.role_id = 'Please select a system role.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Create User
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const res = await userService.createUser({
        email: formData.email.trim(),
        password: formData.password,
        role_id: Number(formData.role_id),
        employee_id: formData.employee_id ? Number(formData.employee_id) : null,
      });

      if (res.success) {
        toast.success(
          `User ${formData.email} created successfully! They can now log in using this password.`
        );
        setIsModalOpen(false);
        await loadData();
      } else {
        setFormErrors({ submit: res.error || 'Failed to create user.' });
      }
    } catch (err) {
      setFormErrors({ submit: err.message || 'An unexpected error occurred.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle user active status
  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active;
      const res = await userService.updateUser(user.id, { is_active: newStatus });
      if (res.success) {
        toast.success(
          `User ${user.email} is now ${newStatus ? 'Active' : 'Inactive'}.`
        );
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus ? 1 : 0 } : u))
        );
      } else {
        toast.error(res.error || 'Could not update user status');
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete user
  const handleDeleteUser = async (user) => {
    if (String(user.id) === String(currentUser?.id)) {
      toast.error('You cannot delete your own account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete user account "${user.email}"?`)) {
      return;
    }

    try {
      const res = await userService.deleteUser(user.id);
      if (res.success) {
        toast.success(`User ${user.email} removed.`);
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else {
        toast.error(res.error || 'Could not delete user');
      }
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  // Stats calculation
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.is_active).length;
  const adminCount = users.filter((u) => u.role_name === 'Admin').length;
  const operationalCount = totalCount - adminCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="System Users"
        description="Manage portal authentication accounts, assign backend system roles, and configure user passwords."
        action={
          <Button
            variant="primary"
            leftIcon={UserPlus}
            onClick={handleOpenModal}
          >
            Create User
          </Button>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="normal" className="flex items-center gap-4">
          <div className="p-3 bg-orange-50 text-orange-600 rounded-xl border border-orange-200">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500">Total Accounts in DB</div>
          </div>
        </Card>

        <Card padding="normal" className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{activeCount}</div>
            <div className="text-xs text-slate-500">Active Logins</div>
          </div>
        </Card>

        <Card padding="normal" className="flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{adminCount}</div>
            <div className="text-xs text-slate-500">Administrators</div>
          </div>
        </Card>

        <Card padding="normal" className="flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-200">
            <User className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{operationalCount}</div>
            <div className="text-xs text-slate-500">HR & Employee Roles</div>
          </div>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card padding="normal">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by email, name, or role..."
              leftIcon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-48">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { label: 'All Roles', value: '' },
                  ...roles.map((r) => ({ label: r.name, value: String(r.id) })),
                ]}
                placeholder=""
              />
            </div>
            <Button
              variant="outline"
              size="md"
              leftIcon={RefreshCw}
              onClick={loadData}
              title="Refresh users list"
            >
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card padding="none">
        {loading ? (
          <div className="p-8">
            <LoadingState rows={5} variant="card" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No system users found"
              description="No accounts match your search filters, or no users have been created yet."
              action={
                <Button variant="primary" leftIcon={UserPlus} onClick={handleOpenModal}>
                  Create User
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User / Email</th>
                  <th className="px-6 py-3.5">Assigned Role</th>
                  <th className="px-6 py-3.5">Linked Employee Profile</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((u) => {
                  const initials = u.email ? u.email.substring(0, 2).toUpperCase() : 'US';
                  const employeeName =
                    u.first_name || u.last_name
                      ? `${u.first_name || ''} ${u.last_name || ''}`.trim()
                      : null;

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center border border-orange-200 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{u.email}</div>
                            <div className="text-xs text-slate-400">ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <Badge variant={getRoleBadgeVariant(u.role_name)}>
                          {u.role_name || 'Unassigned'}
                        </Badge>
                      </td>

                      <td className="px-6 py-4">
                        {employeeName ? (
                          <div>
                            <div className="font-medium text-slate-800">{employeeName}</div>
                            <div className="text-xs text-slate-400">{u.employee_code || 'EMP'}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            System / Unlinked
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-xs text-slate-500">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                            className={u.is_active ? 'text-amber-600' : 'text-emerald-600'}
                            title={u.is_active ? 'Deactivate user' : 'Activate user'}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(u)}
                            className="text-rose-600 hover:bg-rose-50"
                            title="Delete user"
                            disabled={String(u.id) === String(currentUser?.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create User Modal with Password Setting */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !submitting && setIsModalOpen(false)}
        title="Create New System User"
        subtitle="Set authentication credentials and assign a role to allow login access"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={submitting}
              leftIcon={UserPlus}
            >
              Create Account
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formErrors.submit && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.submit}</span>
            </div>
          )}

          {/* Email */}
          <Input
            label="User Email Address"
            type="email"
            placeholder="e.g. user@company.com"
            leftIcon={Mail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
            isRequired
            helperText="This email will be the login username"
          />

          {/* Password */}
          <Input
            label="Account Password"
            type="password"
            placeholder="Minimum 6 characters"
            leftIcon={Lock}
            isPasswordToggleable={true}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
            isRequired
            helperText="User will enter this password on the login page"
          />

          {/* Role */}
          <Select
            label="Assign System Role"
            value={formData.role_id}
            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
            options={roles.map((r) => ({
              label: `${r.name} — ${r.description || ''}`,
              value: String(r.id),
            }))}
            error={formErrors.role_id}
            isRequired
            helperText="Defines the user's portal permissions and dashboard view"
          />

          {/* Linked Employee */}
          <Select
            label="Link to Employee Record (Optional)"
            value={formData.employee_id}
            onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
            options={[
              { label: 'None / Standalone User Account', value: '' },
              ...employees.map((e) => ({
                label: `${e.fullName || e.first_name + ' ' + e.last_name} (${e.employee_code || e.id})`,
                value: String(e.id),
              })),
            ]}
            helperText="Links this login account to an employee's attendance & payroll records"
          />
        </form>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
