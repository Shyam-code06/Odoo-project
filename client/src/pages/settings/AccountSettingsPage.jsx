import React, { useState } from 'react';
import { User, Palette, Shield, Save } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Switch } from '../../components/ui/Switch';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';

export const AccountSettingsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('account');

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');

  const tabs = [
    { id: 'account', label: 'Personal Information', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('Account settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Settings"
        description="Manage your personal account preferences and security options."
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      <form onSubmit={handleSave}>
        {activeTab === 'account' && (
          <Card>
            <CardHeader>
              <CardTitle>Personal Details</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 max-w-xl pt-4">
              <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Work Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <div className="pt-2">
                <Button type="submit" variant="primary" leftIcon={Save}>
                  Save Changes
                </Button>
              </div>
            </CardBody>
          </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 max-w-xl pt-4">
              <Input label="Current Password" type="password" placeholder="••••••••••••" isPasswordToggleable />
              <Input label="New Password" type="password" placeholder="Enter new password" isPasswordToggleable />
              <Input label="Confirm New Password" type="password" placeholder="Confirm new password" isPasswordToggleable />
              <div className="pt-2">
                <Button type="submit" variant="primary" leftIcon={Save}>
                  Update Password
                </Button>
              </div>
            </CardBody>
          </Card>
        )}
      </form>
    </div>
  );
};
