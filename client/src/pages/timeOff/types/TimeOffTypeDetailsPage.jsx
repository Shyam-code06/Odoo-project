import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ShieldCheck,
  Users,
  FileText,
  PieChart,
} from 'lucide-react';
import { useTimeOffType } from '../../../hooks/useTimeOff';
import { useAuth } from '../../../contexts/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';
import { Button } from '../../../components/ui/Button';

export const TimeOffTypeDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canEdit = hasPermission(PERMISSIONS.TIME_OFF_EDIT);

  const { type, loading, error } = useTimeOffType(id);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-neutral-500 mt-2">Loading leave policy details...</p>
      </div>
    );
  }

  if (error || !type) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center max-w-lg mx-auto my-8">
        <h3 className="text-lg font-semibold text-neutral-900">Time Off Type Not Found</h3>
        <p className="text-sm text-neutral-500 mt-1">{error || 'The requested leave policy could not be found.'}</p>
        <Button
          onClick={() => navigate('/time-off/types')}
          className="mt-4 bg-orange-500 text-white text-xs"
        >
          Back to Time Off Types
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/time-off/types')}
            className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">{type.name}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-semibold">
                {type.code}
              </span>
              {type.isActive ? (
                <span className="inline-flex items-center space-x-1 text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs font-medium border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full text-xs font-medium border border-neutral-300">
                  <span>Inactive</span>
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-1">Leave policy configuration & policy metrics</p>
          </div>
        </div>

        {canEdit && (
          <Button
            leftIcon={Edit2}
            onClick={() => navigate(`/time-off/types/${type.id}/edit`)}
            className="bg-orange-500 hover:bg-orange-600 text-white shadow-xs"
          >
            Edit Policy
          </Button>
        )}
      </div>

      {/* Relational Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Allocations</span>
            <p className="text-xl font-bold text-neutral-900 mt-0.5">{type.totalAllocations || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Total Requests</span>
            <p className="text-xl font-bold text-neutral-900 mt-0.5">{type.totalRequests || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase">Active Employees Using</span>
            <p className="text-xl font-bold text-neutral-900 mt-0.5">{type.activeEmployeesCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Policy Details Grid */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-xs space-y-6">
        <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-200 pb-3">
          Leave Policy Configuration
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Policy Name
            </span>
            <span className="text-neutral-900 font-medium">{type.name}</span>
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Policy Code
            </span>
            <span className="font-mono text-neutral-900 font-semibold">{type.code}</span>
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Measurement Unit
            </span>
            <span className="capitalize text-neutral-900 font-medium bg-neutral-100 px-2.5 py-1 rounded inline-block">
              {type.unit}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Entitlement Allocation
            </span>
            {type.requiresAllocation ? (
              <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2.5 py-1 rounded text-xs font-semibold border border-blue-200">
                Requires Allocation
              </span>
            ) : (
              <span className="inline-flex items-center text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded text-xs font-medium">
                No Allocation Required
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Approval Requirement
            </span>
            {type.requiresApproval ? (
              <span className="inline-flex items-center text-purple-700 bg-purple-50 px-2.5 py-1 rounded text-xs font-semibold border border-purple-200">
                Requires HR/Manager Approval
              </span>
            ) : (
              <span className="inline-flex items-center text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded text-xs font-medium">
                Auto-Approved
              </span>
            )}
          </div>

          <div>
            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider block mb-1">
              Pay Policy
            </span>
            {type.isPaid ? (
              <span className="inline-flex items-center text-amber-700 bg-amber-50 px-2.5 py-1 rounded text-xs font-semibold border border-amber-200">
                Paid Leave
              </span>
            ) : (
              <span className="inline-flex items-center text-neutral-700 bg-neutral-100 px-2.5 py-1 rounded text-xs font-medium">
                Unpaid Leave
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
