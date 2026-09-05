import React from 'react';
import { User, Mail, Shield, Building2, Briefcase, Calendar, Phone, MapPin, Edit3 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

export const ProfilePage = () => {
  const { user, currentRole } = useAuth();

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Profile"
        description="View and manage your personal employee account details."
        action={
          <Button variant="outline" leftIcon={Edit3} onClick={() => alert('Edit profile action triggered')}>
            Edit Profile
          </Button>
        }
      />

      {/* Primary Overview Surface Card */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center md:items-start gap-6 p-2">
          <Avatar src={user?.avatar} name={user?.name || 'User'} size="xl" status="online" />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
                <p className="text-xs text-slate-500 font-medium">{user?.jobTitle || 'Employee'}</p>
              </div>
              <Badge variant="primary" size="lg">
                <Shield className="w-3.5 h-3.5 mr-1" />
                {currentRole}
              </Badge>
            </div>
            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 justify-center md:justify-start">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {user?.department || 'Operations'}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {user?.email}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-slate-400" />
                {user?.location || 'Headquarters'}
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
              <span className="font-semibold text-slate-900">{user?.employeeId || 'EMP-2026-001'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Work Email</span>
              <span className="font-semibold text-slate-900">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Phone Number</span>
              <span className="font-semibold text-slate-900">{user?.phone || '+1 (555) 000-0000'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Joined Date</span>
              <span className="font-semibold text-slate-900">{user?.joinedDate || 'Jan 15, 2024'}</span>
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
              <span className="font-semibold text-slate-900">Frontend AuthService</span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
