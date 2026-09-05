import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Edit2,
  Trash2,
  ArrowLeft,
  Users,
  Building2,
  Info,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Card } from '../../components/ui/Card';
import { ConfirmationDialog } from '../../components/ui/ConfirmationDialog';
import { useJobPositionDetail } from '../../hooks/useJobPositions';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS } from '../../config/permissions';
import { jobPositionService } from '../../services/jobPositionService';

export const JobPositionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);

  const { jobPosition, loading, error } = useJobPositionDetail(id);

  const canEdit = hasPermission(PERMISSIONS.JOB_POSITIONS_EDIT);
  const canDelete = hasPermission(PERMISSIONS.JOB_POSITIONS_DELETE);

  const handleDeleteConfirm = async () => {
    try {
      await jobPositionService.deleteJobPosition(id);
      toast.success(`Job position "${jobPosition.title}" deleted.`);
      navigate('/job-positions');
    } catch (e) {
      toast.error('Failed to delete job position.');
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

  if (error || !jobPosition) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center my-8">
        <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Job Position Not Found</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-4">
          The requested job position record does not exist or was removed.
        </p>
        <Button variant="outline" leftIcon={ArrowLeft} onClick={() => navigate('/job-positions')}>
          Back to Job Positions
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
          onClick={() => navigate('/job-positions')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Job Positions
        </button>
      </div>

      {/* Main Profile Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-200 text-purple-600 flex items-center justify-center shadow-2xs shrink-0">
              <Briefcase className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">{jobPosition.title}</h1>
                <StatusBadge status={jobPosition.status} />
              </div>
              <p className="text-xs font-mono text-slate-500 font-semibold mt-0.5">
                Code: {jobPosition.code}
              </p>
              {jobPosition.department && (
                <div
                  onClick={() => navigate(`/departments/${jobPosition.department.id}`)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:underline mt-1 cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Department: {jobPosition.department.name} ({jobPosition.department.code})
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            {canEdit && (
              <Button
                variant="outline"
                size="md"
                leftIcon={Edit2}
                onClick={() => navigate(`/job-positions/${jobPosition.id}/edit`)}
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

      {/* Information Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Position Info & Department Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Position Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Info className="w-4 h-4 text-purple-600" />
              Position Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Position Title</span>
                <span className="font-semibold text-slate-800">{jobPosition.title}</span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Position Code</span>
                <span className="font-mono font-bold text-slate-800 px-2 py-0.5 bg-slate-100 rounded border border-slate-200">
                  {jobPosition.code}
                </span>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Status</span>
                <StatusBadge status={jobPosition.status} />
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Created Date</span>
                <span className="text-slate-700">
                  {new Date(jobPosition.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-xs font-medium text-slate-400 block mb-0.5">Role Description</span>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/80 leading-relaxed text-xs">
                  {jobPosition.description || 'No detailed role description recorded for this job position.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Department Information */}
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-purple-600" />
              Department Relationship
            </h3>

            {jobPosition.department ? (
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center font-bold text-xs">
                    {jobPosition.department.code}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{jobPosition.department.name}</h4>
                    <p className="text-xs text-slate-500 font-mono">Code: {jobPosition.department.code}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/departments/${jobPosition.department.id}`)}
                >
                  View Department
                </Button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No assigned department.</p>
            )}
          </Card>
        </div>

        {/* Right Column: Workforce Summary */}
        <div className="space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Workforce Allocation
            </h3>

            <div
              onClick={() => navigate(`/employees?job_position_id=${jobPosition.id}`)}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl border border-blue-200/80 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-900 block leading-none">
                      {jobPosition.employeeCount}
                    </span>
                    <span className="text-xs font-semibold text-blue-900 mt-1 block">
                      Assigned Employees
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-500 group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-blue-700 mt-3 pt-2 border-t border-blue-200/60 font-medium">
                Click to view employees in this role &rarr;
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
        title={`Delete Job Position "${jobPosition.title}"?`}
        message={
          jobPosition.employeeCount > 0
            ? `Warning: Position is currently assigned to ${jobPosition.employeeCount} active employees. Deleting this role will clear position links.`
            : `Are you sure you want to delete ${jobPosition.title}? This action cannot be undone.`
        }
        confirmText="Delete Job Position"
        isDanger
      />
    </div>
  );
};
