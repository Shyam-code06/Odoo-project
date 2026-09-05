import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Building2,
  Briefcase,
  UserCheck,
  CalendarClock,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmployeeSmartButtons } from './components/EmployeeSmartButtons';
import { useEmployeeDetail } from '../../hooks/useEmployees';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { formatDate } from '../../utils/formatters';

export const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const { employee, loading, error, refresh } = useEmployeeDetail(id);

  const canEdit = hasPermission(PERMISSIONS.EMPLOYEES_EDIT);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Employee Profile" description="Loading master employee profile..." />
        <LoadingState variant="card" rows={3} />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="py-12">
        <ErrorState
          title="Employee Profile Not Found"
          description={error || "The requested employee record could not be retrieved."}
          onRetry={refresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={employee.fullName}
        description={`Employee Code: ${employee.employee_code} • Master Record`}
        secondaryActions={
          <Button variant="outline" size="md" leftIcon={ArrowLeft} onClick={() => navigate('/employees')}>
            Back to List
          </Button>
        }
        action={
          canEdit && (
            <Button
              variant="primary"
              size="md"
              leftIcon={Edit2}
              onClick={() => navigate(`/employees/${employee.id}/edit`)}
            >
              Edit Profile
            </Button>
          )
        }
      />

      {/* Primary Profile Card Banner */}
      <Card>
        <CardBody className="flex flex-col md:flex-row items-center md:items-start gap-6 p-2">
          <Avatar src={employee.avatar} name={employee.fullName} size="xl" status="online" />
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{employee.fullName}</h2>
                <div className="text-xs text-slate-500 font-medium font-mono">
                  {employee.employee_code}
                </div>
              </div>
              <StatusBadge status={employee.employment_status} size="lg" />
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs text-slate-600 justify-center md:justify-start font-medium">
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-orange-500" />
                {employee.jobPositionTitle}
              </span>
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                {employee.departmentName}
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {employee.email}
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Smart Buttons Row */}
      <EmployeeSmartButtons employeeId={employee.id} counts={employee.relatedCounts} />

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal & Work Information (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4">
              <div>
                <span className="text-slate-500 block mb-0.5">First Name</span>
                <span className="font-semibold text-slate-900">{employee.first_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Last Name</span>
                <span className="font-semibold text-slate-900">{employee.last_name}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Work Email</span>
                <span className="font-semibold text-slate-900">{employee.email}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Phone Number</span>
                <span className="font-semibold text-slate-900">{employee.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Date of Birth</span>
                <span className="font-semibold text-slate-900">{formatDate(employee.date_of_birth) || 'N/A'}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block mb-0.5">Residential Address</span>
                <span className="font-semibold text-slate-900">{employee.address || 'N/A'}</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Work Information</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4">
              <div>
                <span className="text-slate-500 block mb-0.5">Employee Code</span>
                <span className="font-semibold text-slate-900 font-mono">{employee.employee_code}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Joining Date</span>
                <span className="font-semibold text-slate-900">{formatDate(employee.joining_date)}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Department</span>
                <span className="font-semibold text-slate-900">{employee.departmentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Job Position</span>
                <span className="font-semibold text-slate-900">{employee.jobPositionTitle}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Employment Status</span>
                <StatusBadge status={employee.employment_status} />
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">Assigned Shift</span>
                <span className="font-semibold text-slate-900">{employee.workingScheduleName}</span>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Manager & Schedule Info Sidebar (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Reporting Manager</CardTitle>
            </CardHeader>
            <CardBody className="pt-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {employee.managerName}
                  </div>
                  <div className="text-xs text-slate-500">Supervising Officer</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Working Schedule</CardTitle>
            </CardHeader>
            <CardBody className="pt-3 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <CalendarClock className="w-4 h-4 text-orange-500" />
                {employee.workingScheduleName}
              </div>
              <p className="text-slate-500 leading-relaxed">
                Standard shift configuration with 40 weekly hours and 60-minute lunch break.
              </p>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
