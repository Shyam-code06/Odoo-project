import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Edit2,
  Trash2,
  ArrowLeft,
  Users,
  Briefcase,
  UserCheck,
  Mail,
  Hash,
  Info,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useDepartmentDetail } from '../../hooks/useDepartments';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS } from '../../config/permissions';
import { departmentService } from '../../services/departmentService';

export const DepartmentDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const { department, loading, error } = useDepartmentDetail(id);

  const canEdit = hasPermission(PERMISSIONS.DEPARTMENTS_EDIT);
  const canDelete = hasPermission(PERMISSIONS.DEPARTMENTS_DELETE);

  const handleDeleteConfirm = async () => {
    try {
      await departmentService.deleteDepartment(id);
      toast.success(`Department "${department.name}" deleted.`);
      navigate('/departments');
    } catch (e) {
      toast.error('Failed to delete department.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 w-48 rounded-md" />
        <div className="h-44 bg-white rounded-xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
          <div className="h-64 bg-white rounded-xl border border-slate-200" />
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-8">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Department Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
          The requested department record does not exist or was removed.
        </p>
        <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate('/departments')}>
          Back to Departments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/departments')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Departments
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 border-2 border-orange-200 text-orange-600 flex items-center justify-center font-black text-xl shadow-2xs shrink-0">
              {department.code}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{department.name}</h1>
                <StatusBadge status={department.status} />
              </div>
              <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">
                Code: {department.code}
              </p>
              <p className="text-sm text-slate-600 mt-1 max-w-2xl">
                {department.description || 'No description provided.'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {canEdit && (
              <Button
                variant="outline"
                size="md"
                leftIcon={Edit2}
                onClick={() => navigate(`/departments/${department.id}/edit`)}
              >
                Edit
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="md"
                leftIcon={Trash2}
                onClick={() => setIsDeleting(true)}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Details & Workforce Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Information & Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-4 h-4 text-orange-600" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Department Name</span>
                <span className="font-semibold text-slate-800">{department.name}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Department Code</span>
                <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {department.code}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Status</span>
                <StatusBadge status={department.status} />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Created Date</span>
                <span className="text-slate-700">
                  {new Date(department.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Description</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed text-xs">
                  {department.description || 'No detailed description recorded for this department.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Department Manager */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-orange-600" />
              Management & Reporting
            </h3>

            {department.manager ? (
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <Avatar src={department.manager.avatar} name={department.manager.name} size="sm" style={{ flexShrink: 0 }} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-sm">{department.manager.name}</h4>
                  <p className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-0.5">
                    <Hash className="w-3 h-3 text-slate-400" /> {department.manager.code}
                  </p>
                  <p className="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" /> {department.manager.email}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/employees/${department.manager.id}`)}
                >
                  View Profile
                </Button>
              </div>
            ) : (
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Manager Assigned</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">
                  Assign an employee as manager to define reporting leadership.
                </p>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/departments/${department.id}/edit`)}
                  >
                    Assign Manager
                  </Button>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Workforce Summary & Smart Buttons */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Workforce Summary
            </h3>

            {/* Smart Employee Count Button */}
            <div
              onClick={() => navigate(`/employees?department_id=${department.id}`)}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block leading-none">
                      {department.employeeCount}
                    </span>
                    <span className="text-xs font-semibold text-blue-900 mt-1 block">
                      Total Employees
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-blue-700 mt-3 pt-2 border-t border-blue-200/60 font-medium">
                Click to view filtered employee directory &rarr;
              </p>
            </div>

            {/* Smart Job Position Count Button */}
            <div
              onClick={() => navigate(`/job-positions?department_id=${department.id}`)}
              className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl border border-purple-200/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block leading-none">
                      {department.jobPositionCount}
                    </span>
                    <span className="text-xs font-semibold text-purple-900 mt-1 block">
                      Job Positions
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-purple-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-purple-700 mt-3 pt-2 border-t border-purple-200/60 font-medium">
                Click to view department job position roles &rarr;
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleting}
        onClose={() => setIsDeleting(false)}
        onConfirm={handleDeleteConfirm}
        title={`Delete Department "${department.name}"?`}
        message={
          department.employeeCount > 0 || department.jobPositionCount > 0
            ? `Warning: Department currently contains ${department.employeeCount} active employees and ${department.jobPositionCount} job positions. Deleting this department will affect organizational hierarchy.`
            : `Are you sure you want to delete ${department.name}? This action cannot be undone.`
        }
        confirmText="Delete Department"
        isDanger
      />
    </div>
  );
};
