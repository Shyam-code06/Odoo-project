import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  DollarSign,
  Building2,
  Briefcase,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { SearchInput } from '../../components/ui/SearchInput';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/ui/Pagination';
import { Avatar } from '../../components/ui/Avatar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { IconButton } from '../../components/ui/IconButton';
import { Select } from '../../components/ui/Select';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { PERMISSIONS, ROLES, normalizeRole } from '../../config/permissions';
import { contractService } from '../../services/contractService';
import { departmentService } from '../../services/departmentService';

export const ContractListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { currentRole } = useAuth();

  // Contract creation and modifications are strictly restricted to HR Payroll Manager
  const isHRPayrollManager = normalizeRole(currentRole) === ROLES.HR_PAYROLL_MANAGER;
  const canCreate = isHRPayrollManager;
  const canEdit = isHRPayrollManager;

  const initEmp = searchParams.get('employeeId') || searchParams.get('employee_id') || '';

  const [contracts, setContracts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [departmentOptions, setDepartmentOptions] = useState([]);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    departmentId: '',
    employeeId: initEmp,
    page: 1,
    pageSize: 10,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contractService.getContracts(filters);
      setContracts(res.data || []);
      setTotalCount(res.total || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      toast.error('Failed to load contracts.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  useEffect(() => {
    if (typeof departmentService?.getDepartmentOptions === 'function') {
      departmentService.getDepartmentOptions().then((opts) => {
        if (Array.isArray(opts)) {
          setDepartmentOptions(opts.map((d) => ({ value: d.id, label: d.name })));
        }
      }).catch(() => {});
    }
  }, []);

  const handleUpdateStatus = async (contractId, newStatus) => {
    try {
      await contractService.updateContractStatus(contractId, newStatus);
      toast.success(`Contract status updated to ${newStatus}.`);
      fetchContracts();
    } catch (err) {
      toast.error(err.message || 'Failed to update contract status.');
    }
  };

  const updateFilter = (newVals) => {
    setFilters((prev) => ({
      ...prev,
      ...newVals,
      page: newVals.page !== undefined ? newVals.page : 1,
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      departmentId: '',
      employeeId: '',
      page: 1,
      pageSize: 10,
      sortBy: 'created_at',
      sortOrder: 'desc',
    });
  };

  const activeFilterCount = [
    filters.search,
    filters.status,
    filters.departmentId,
    filters.employeeId,
  ].filter(Boolean).length;

  // Metric summaries calculated from current data / total
  const activeCount = contracts.filter((c) => c.status === 'active').length;
  const draftCount = contracts.filter((c) => c.status === 'draft').length;
  const otherCount = contracts.filter((c) => ['expired', 'terminated', 'cancelled'].includes(c.status)).length;

  const columns = [
    {
      header: 'Contract #',
      key: 'contract_number',
      sortable: true,
      render: (row) => (
        <div
          onClick={() => navigate(`/contracts/${row.id}`)}
          className="font-mono text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
        >
          {row.contract_number}
        </div>
      ),
    },
    {
      header: 'Employee',
      key: 'employee',
      render: (row) => {
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Employee';
        return (
          <div className="flex items-center gap-3">
            <Avatar name={fullName} size="sm" />
            <div>
              <div
                onClick={() => navigate(`/employees/${row.employee_id}`)}
                className="font-semibold text-slate-900 hover:text-orange-600 cursor-pointer transition-colors text-xs"
              >
                {fullName}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {row.employee_code}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Department & Role',
      key: 'department',
      render: (row) => (
        <div>
          <div className="text-xs font-semibold text-slate-800">
            {row.job_position_title || 'Unassigned Role'}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
            <Building2 className="w-3 h-3 text-slate-400" />
            {row.department_name || 'No Department'}
          </div>
        </div>
      ),
    },
    {
      header: 'Monthly Wage',
      key: 'wage',
      sortable: true,
      render: (row) => (
        <div className="font-semibold text-xs text-slate-900 font-mono">
          ${Number(row.wage || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          {row.salary_structure_name && (
            <span className="block text-[10px] text-slate-400 font-sans font-normal truncate max-w-[140px]">
              {row.salary_structure_name}
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Duration',
      key: 'duration',
      render: (row) => (
        <div className="text-xs text-slate-700 font-mono">
          <div>{row.start_date ? String(row.start_date).split('T')[0] : '—'}</div>
          <div className="text-[11px] text-slate-400">
            {row.end_date ? `to ${String(row.end_date).split('T')[0]}` : 'Indefinite'}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'employment_type',
      render: (row) => {
        const typeMap = {
          full_time: 'Full-time',
          part_time: 'Part-time',
          contract: 'Contractor',
          internship: 'Internship',
        };
        return (
          <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded capitalize">
            {typeMap[row.employment_type] || row.employment_type || 'Full-time'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      key: 'status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <IconButton
            icon={Eye}
            ariaLabel="View contract details"
            size="sm"
            onClick={() => navigate(`/contracts/${row.id}`)}
          />
          {canEdit && (
            <IconButton
              icon={Edit2}
              ariaLabel="Edit contract"
              size="sm"
              onClick={() => navigate(`/contracts/${row.id}/edit`)}
            />
          )}
          {canEdit && row.status === 'draft' && (
            <Button
              size="sm"
              variant="outline"
              className="text-[11px] px-2 py-0.5 h-7 text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              onClick={() => handleUpdateStatus(row.id, 'active')}
            >
              Activate
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employment Contracts"
        description="Manage employment contracts, salary terms, and working conditions across your workforce."
        action={
          canCreate && (
            <Button
              variant="primary"
              size="md"
              leftIcon={Plus}
              onClick={() => navigate('/contracts/new')}
            >
              Add Contract
            </Button>
          )
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block leading-none">
              {totalCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Total Contracts
            </span>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block leading-none">
              {activeCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Active Contracts
            </span>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block leading-none">
              {draftCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Draft Contracts
            </span>
          </div>
        </Card>

        <Card className="p-3.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 block leading-none">
              {otherCount}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
              Expired / Inactive
            </span>
          </div>
        </Card>
      </div>

      {/* Toolbar Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search by contract #, employee name or code..."
          value={filters.search}
          onChange={(e) => updateFilter({ search: e.target.value })}
          onClear={() => updateFilter({ search: '' })}
          className="max-w-md"
        />

        <div className="flex flex-wrap items-center gap-2.5 justify-end">
          {/* Department Filter */}
          <div className="w-44">
            <Select
              placeholder="All Departments"
              options={[{ value: '', label: 'All Departments' }, ...departmentOptions]}
              value={filters.departmentId}
              onChange={(e) => updateFilter({ departmentId: e.target.value })}
            />
          </div>

          {/* Status Filter */}
          <div className="w-36">
            <Select
              placeholder="All Statuses"
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'expired', label: 'Expired' },
                { value: 'terminated', label: 'Terminated' },
              ]}
              value={filters.status}
              onChange={(e) => updateFilter({ status: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-medium">Active Filters:</span>
          {filters.search && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Query: {filters.search}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter({ search: '' })} />
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Status: {filters.status}
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter({ status: '' })} />
            </span>
          )}
          {filters.departmentId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Department Filter
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter({ departmentId: '' })} />
            </span>
          )}
          {filters.employeeId && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
              Filtered by Employee
              <X className="w-3 h-3 cursor-pointer" onClick={() => updateFilter({ employeeId: '' })} />
            </span>
          )}
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs text-orange-600 hover:underline font-semibold ml-2 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Contracts Table */}
      <div>
        <Table
          columns={columns}
          data={contracts || []}
          isLoading={loading}
          sortColumn={filters.sortBy}
          sortDirection={filters.sortOrder}
          onSort={(key) =>
            updateFilter({
              sortBy: key,
              sortOrder: filters.sortBy === key && filters.sortOrder === 'asc' ? 'desc' : 'asc',
            })
          }
          emptyTitle="No contracts found"
          emptyDescription="Contracts added by Admin or HR will be displayed here."
        />
        <Pagination
          currentPage={filters.page}
          totalPages={totalPages}
          totalItems={totalCount}
          pageSize={filters.pageSize}
          onPageChange={(page) => updateFilter({ page })}
          onPageSizeChange={(pageSize) => updateFilter({ pageSize, page: 1 })}
        />
      </div>
    </div>
  );
};

export default ContractListPage;
