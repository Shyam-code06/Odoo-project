import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  FileText,
  User,
  Building2,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS, ROLES, normalizeRole } from '../../config/permissions';
import { contractService } from '../../services/contractService';

export const ContractDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { currentRole } = useAuth();
  const canEdit = normalizeRole(currentRole) === ROLES.HR_PAYROLL_MANAGER;

  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const data = await contractService.getContractById(id);
      if (data) {
        setContract(data);
      } else {
        toast.error('Contract not found.');
        navigate('/contracts');
      }
    } catch (err) {
      toast.error('Failed to load contract.');
      navigate('/contracts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await contractService.updateContractStatus(id, newStatus);
      toast.success(`Contract status updated to ${newStatus}.`);
      fetchContract();
    } catch (err) {
      toast.error(err.message || 'Failed to update contract status.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="inline-block w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-2 text-sm">Loading contract details...</p>
      </div>
    );
  }

  if (!contract) return null;

  const fullName = `${contract.first_name || ''} ${contract.last_name || ''}`.trim() || 'Employee';

  const typeMap = {
    full_time: 'Full-time',
    part_time: 'Part-time',
    contract: 'Contractor',
    internship: 'Internship',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          leftIcon={ArrowLeft}
          onClick={() => navigate('/contracts')}
        >
          Back to Contracts
        </Button>

        <div className="flex items-center gap-2">
          {canEdit && contract.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              leftIcon={CheckCircle}
              onClick={() => handleStatusChange('active')}
            >
              Activate Contract
            </Button>
          )}

          {canEdit && contract.status === 'active' && (
            <Button
              size="sm"
              variant="outline"
              className="text-rose-700 border-rose-300 hover:bg-rose-50"
              leftIcon={XCircle}
              onClick={() => handleStatusChange('terminated')}
            >
              Terminate
            </Button>
          )}

          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={Edit2}
              onClick={() => navigate(`/contracts/${contract.id}/edit`)}
            >
              Edit Contract
            </Button>
          )}
        </div>
      </div>

      <PageHeader
        title={`Contract: ${contract.contract_number}`}
        description={`Employment terms and compensation agreement for ${fullName}.`}
        action={<StatusBadge status={contract.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Employee Profile Summary */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Employee Profile</CardTitle>
          </CardHeader>
          <CardBody className="text-center pt-4 pb-6">
            <div className="flex justify-center mb-3">
              <Avatar name={fullName} size="xl" />
            </div>
            <h3
              onClick={() => navigate(`/employees/${contract.employee_id}`)}
              className="font-bold text-base text-slate-900 hover:text-orange-600 cursor-pointer transition-colors"
            >
              {fullName}
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{contract.employee_code}</p>
            <p className="text-xs text-slate-500 mt-1">{contract.employee_email}</p>

            <div className="mt-6 pt-4 border-t border-slate-100 text-left space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-800">{contract.department_name || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Job Title</span>
                <span className="font-semibold text-slate-800">{contract.job_position_title || '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Schedule</span>
                <span className="font-semibold text-slate-800">{contract.schedule_name || 'Standard Shift'}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Right Column: Contract Terms & Compensation */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compensation & Salary Structure</CardTitle>
            </CardHeader>
            <CardBody className="grid grid-cols-2 gap-4 pt-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Monthly Base Wage</span>
                <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                  ${Number(contract.wage || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] text-slate-500 font-medium block">Salary Structure</span>
                <span className="text-sm font-bold text-slate-800 mt-1 block">
                  {contract.salary_structure_name || 'Default Regular Structure'}
                </span>
                {contract.salary_structure_code && (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Code: {contract.salary_structure_code}
                  </span>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms & Working Conditions</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 pt-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-400 block mb-1">Employment Type</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {typeMap[contract.employment_type] || contract.employment_type || 'Full-time'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Start Date</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {contract.start_date ? String(contract.start_date).split('T')[0] : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">End Date</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {contract.end_date ? String(contract.end_date).split('T')[0] : 'Indefinite'}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-[11px] text-slate-400">
                <div>
                  Created: <span className="text-slate-600 font-mono">{contract.created_at ? new Date(contract.created_at).toLocaleDateString() : '—'}</span>
                </div>
                <div>
                  Last Modified: <span className="text-slate-600 font-mono">{contract.updated_at ? new Date(contract.updated_at).toLocaleDateString() : '—'}</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ContractDetailsPage;
