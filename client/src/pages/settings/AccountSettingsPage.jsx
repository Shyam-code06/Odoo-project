import React, { useState, useEffect } from 'react';
import { User, Palette, Shield, Save } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { authService } from '../../services/authService';
import { employeeService } from '../../services/employeeService';

export const AccountSettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Synchronize state when user or profile changes
  useEffect(() => {
    if (user) {
      const resolvedName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
      setName(resolvedName);
      setEmail(user.email || '');
      setPhone(user.phone || '');

      // Also query employee record if linked to guarantee live DB phone
      const empId = user.employee_id || user.id;
      if (empId) {
        employeeService.getEmployeeById(empId).then((emp) => {
          if (emp) {
            if (emp.phone) setPhone(emp.phone);
            if (emp.first_name || emp.last_name) {
              setName(`${emp.first_name || ''} ${emp.last_name || ''}`.trim());
            }
          }
        }).catch(() => {});
      }
    }
  }, [user]);

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const tabs = [
    { id: 'account', label: 'Personal Information', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const parts = name.trim().split(' ');
      const first_name = parts[0] || '';
      const last_name = parts.slice(1).join(' ') || '';

      await updateUserProfile({
        first_name,
        last_name,
        name: name.trim(),
        phone: phone.trim(),
      });
      toast.success('Personal details saved successfully in database.');
    } catch (err) {
      toast.error(err.message || 'Failed to update personal details.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.newPassword) {
      toast.error('Please enter a new password.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    try {
      setSaving(true);
      const res = await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.success) {
        toast.success(res.message || 'Password updated successfully in database.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        toast.error(res.error || 'Failed to update password.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your personal account preferences and security options."
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <div className="space-y-6">
        {activeTab === 'account' && (
          <form onSubmit={handleSavePersonal}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4 max-w-xl pt-4">
                <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Work Email" type="email" value={email} disabled helperText="Contact HR or Administrator to modify work email address." />
                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                <div className="pt-2">
                  <Button type="submit" variant="primary" leftIcon={Save} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        )}

        {activeTab === 'appearance' && (
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Theme</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 max-w-xl pt-4 text-xs text-slate-600">
              <p className="leading-relaxed">
                HRMS uses a surface-level SaaS visual identity anchored around Primary Orange (`#F97316`), Light Pink accents (`#FFF1F2`), and crisp white card containers.
              </p>
              <div className="p-4 bg-orange-50/50 rounded-xl border border-orange-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">Current Theme: Light Surface</div>
                  <div className="text-[11px] text-slate-500">Optimized for high-contrast readability and enterprise data scanability</div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold bg-orange-500 text-white rounded-md">
                  Active
                </span>
              </div>
            </CardBody>
          </Card>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleUpdatePassword}>
            <Card>
              <CardHeader>
                <CardTitle>Password & Security</CardTitle>
              </CardHeader>
              <CardBody className="space-y-4 max-w-xl pt-4">
                <Input
                  label="Current Password"
                  type="password"
                  placeholder="Enter current password (if known)"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  isPasswordToggleable
                />
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  isPasswordToggleable
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  isPasswordToggleable
                  required
                />
                <div className="pt-2">
                  <Button type="submit" variant="primary" leftIcon={Save} disabled={saving}>
                    {saving ? 'Updating...' : 'Set New Password'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        )}
      </div>
    </div>
  );
};

