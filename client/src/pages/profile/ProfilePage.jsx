import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Building2, Briefcase, Calendar, Phone, MapPin, Edit3, Save } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { employeeService } from '../../services/employeeService';
import { authService } from '../../services/authService';
import { useToast } from '../../components/ui/Toast';

export const ProfilePage = () => {
  const { user, currentRole } = useAuth();
  const toast = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
  });

  const empId = user?.employee_id || user?.id;

  const loadProfile = async () => {
    if (!empId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await employeeService.getEmployeeById(empId);
      if (data) {
        setProfile(data);
        setEditFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
        });
      }
    } catch (err) {
      console.warn('[ProfilePage] Failed to fetch profile from database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [empId]);

  const handleOpenEdit = () => {
    const currentFirst = profile?.first_name || (profile?.fullName ? profile.fullName.split(' ')[0] : (user?.first_name || ''));
    const currentLast = profile?.last_name || (profile?.fullName ? profile.fullName.split(' ').slice(1).join(' ') : (user?.last_name || ''));

    setEditFormData({
      first_name: currentFirst,
      last_name: currentLast,
      phone: profile?.phone || user?.phone || '',
      address: profile?.address || user?.address || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!empId) return;

    try {
      setSaving(true);
      const res = await employeeService.updateEmployee(empId, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        phone: editFormData.phone,
        address: editFormData.address,
      });

      if (res && (res.success || res.employee)) {
        toast.success('Profile updated successfully.');
        setIsEditModalOpen(false);
        await loadProfile();

        // Sync auth state in background
        authService.updateProfile({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          name: `${editFormData.first_name} ${editFormData.last_name}`.trim(),
          phone: editFormData.phone,
        });
      } else {
        toast.error(res?.error || 'Failed to update profile.');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Resolved display values (Real DB record優先, user session fallback)
  const displayName = profile?.fullName || `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || user?.name || 'User';
  const displayJobTitle = profile?.jobPositionTitle || profile?.job_title || user?.jobTitle || 'Employee';
  const displayDepartment = profile?.departmentName || profile?.department_name || user?.department || 'Operations';
  const displayEmail = profile?.email || user?.email || 'N/A';
  const displayPhone = profile?.phone || user?.phone || 'Not Provided';
  const displayEmployeeCode = profile?.employee_code || user?.employeeId || user?.employee_code || `EMP-${empId}`;
  const displayLocation = profile?.address || user?.location || 'Headquarters';
  const displayJoinedDate = profile?.joining_date ? new Date(profile.joining_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (user?.joinedDate || 'Jan 15, 2024');

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View and manage your personal employee account details."
        action={
          <Button variant="outline" leftIcon={Edit3} onClick={handleOpenEdit}>
            Edit Profile
          </Button>
        }
      />

      {/* Primary Overview Surface Card */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center md:items-start gap-6 p-2">
          <Avatar src={profile?.avatar || user?.avatar} name={displayName} size="xl" status="online" />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                <p className="text-xs text-slate-500 font-medium">{displayJobTitle}</p>
              </div>
              <Badge variant="primary" size="lg">
                <Shield className="w-3.5 h-3.5 mr-1" />
                {currentRole}
              </Badge>
            </div>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 justify-center md:justify-start">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {displayDepartment}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {displayEmail}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {displayLocation}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Account & Organization Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Employee ID</span>
              <span className="font-semibold text-slate-900">{displayEmployeeCode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Work Email</span>
              <span className="font-semibold text-slate-900">{displayEmail}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone Number</span>
              <span className="font-semibold text-slate-900">{displayPhone}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Joined Date</span>
              <span className="font-semibold text-slate-900">{displayJoinedDate}</span>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Authorization</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Current Role</span>
              <span className="font-semibold text-slate-900">{currentRole}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Session Status</span>
              <span className="font-semibold text-emerald-600">Active (Authenticated)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Authentication Source</span>
              <span className="font-semibold text-slate-900">Database (MySQL)</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Profile"
        subtitle="Update your personal contact details."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
              <Input
                value={editFormData.first_name}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
              <Input
                value={editFormData.last_name}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <Input
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
            <Input
              value={editFormData.address}
              onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              placeholder="City, Country"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              leftIcon={Save}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
