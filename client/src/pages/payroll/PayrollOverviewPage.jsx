import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import { contractService } from '../../services/contractService';
import payrunService from '../../services/payrunService';
import { payslipService } from '../../services/payslipService';
import { useSalaryStructures } from '../../hooks/useSalary';
import { formatCurrency, formatDate } from '../../utils/formatters';

import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';

import {
  CircleDollarSign,
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  Receipt,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  TrendingUp,
  Users,
  Eye,
  RefreshCw,
  Sparkles,
  Sliders,
  FolderKanban,
  FileText,
  AlertCircle
} from 'lucide-react';

export default function PayrollOverviewPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSIONS.PAYRUNS_CREATE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [contracts, setContracts] = useState([]);
  const [payruns, setPayruns] = useState([]);
  const [payrunMetrics, setPayrunMetrics] = useState({});
  const [payslips, setPayslips] = useState([]);

  const { items: structures = [] } = useSalaryStructures({ pageSize: 100 });

  const fetchOverviewData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch active contracts to calculate monthly commitment & structure distribution
      const contractsRes = await contractService.getContracts({ limit: 100, status: 'active' }).catch((err) => {
        console.warn('[PayrollOverview] contracts fetch failed:', err);
        return { data: [] };
      });
      const activeContracts = contractsRes.data || [];
      setContracts(activeContracts);

      // 2. Fetch payrun batches
      const payrunsRes = await payrunService.getPayruns({ pageSize: 50, sortBy: 'periodEnd', sortDirection: 'desc' }).catch((err) => {
        console.warn('[PayrollOverview] payruns fetch failed:', err);
        return { success: false, data: { items: [], metrics: {} } };
      });
      if (payrunsRes?.success && payrunsRes.data) {
        setPayruns(payrunsRes.data.items || []);
        setPayrunMetrics(payrunsRes.data.metrics || {});
      }

      // 3. Fetch payslips for historical net disbursed and statutory deductions
      const payslipsRes = await payslipService.getPayslips({ pageSize: 100 }).catch((err) => {
        console.warn('[PayrollOverview] payslips fetch failed:', err);
        return { items: [], metrics: {} };
      });
      setPayslips(payslipsRes.items || []);
    } catch (err) {
      console.error('[PayrollOverview] Error fetching data:', err);
      setError(err.message || 'Failed to load payroll overview data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverviewData();
  }, [fetchOverviewData]);

  // Calculations
  // Total Monthly Payroll Commitment from active employee contracts
  const totalMonthlyCommitment = contracts.reduce((sum, c) => sum + Number(c.wage || 0), 0);

  // Group active contracts by salary structure
  const structureSpendMap = {};
  contracts.forEach((c) => {
    const structId = c.salary_structure_id || 'unknown';
    const structName = c.salary_structure_name || 'Standard Structure';
    const structCode = c.salary_structure_code || '';
    if (!structureSpendMap[structId]) {
      structureSpendMap[structId] = {
        id: structId,
        name: structName,
        code: structCode,
        employeeCount: 0,
        totalWage: 0,
      };
    }
    structureSpendMap[structId].employeeCount += 1;
    structureSpendMap[structId].totalWage += Number(c.wage || 0);
  });

  const structureSpendList = Object.values(structureSpendMap).sort((a, b) => b.totalWage - a.totalWage);

  // Completed & Disbursed Payouts (from paid payslips or paid payruns)
  const paidPayslips = payslips.filter((p) => p.status === 'paid');
  const totalDisbursedNet = paidPayslips.reduce((sum, p) => sum + Number(p.netSalary || 0), 0);
  const totalDisbursedGross = paidPayslips.reduce((sum, p) => sum + Number(p.grossSalary || 0), 0);

  // Total Statutory & Compliance Deductions (PF, PT) across all processed payslips
  const totalStatutoryDeductions = payslips.reduce((sum, p) => sum + Number(p.totalDeductions || 0), 0);

  // In-Pipeline / Pending Payout (from computed or validated payruns)
  const pendingPayruns = payruns.filter((p) => p.status === 'computed' || p.status === 'validated');
  const pendingPayslips = payslips.filter((p) => p.status === 'computed' || p.status === 'generated');
  const totalPendingPayout = pendingPayslips.reduce((sum, p) => sum + Number(p.netSalary || 0), 0);

  // Spotlight payrun (newest active/pending payrun, or latest payrun)
  const activePayrun = payruns.find((p) => p.status !== 'paid') || payruns[0] || null;

  // Status badge helper
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'draft':
        return <Badge variant="neutral" className="bg-slate-100 text-slate-700">Draft</Badge>;
      case 'computed':
        return <Badge variant="warning">Computed</Badge>;
      case 'validated':
        return <Badge variant="blue">Validated</Badge>;
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      default:
        return <Badge variant="neutral">{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payroll Overview"
          description="Executive financial summary, organization monthly commitments, and cycle analytics."
        />
        <LoadingState message="Loading payroll overview dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Payroll Overview"
          description="Executive financial summary, organization monthly commitments, and cycle analytics."
        />
        <ErrorState description={error} onRetry={fetchOverviewData} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header & Actions Hub */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-sm">
              <CircleDollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Payroll Overview
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Executive financial summaries, active cycle tracking, and salary structure allocations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverviewData}
            className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            title="Reload live metrics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payroll/payslips')}
            className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            <span>Payslips Directory</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/payroll/payruns')}
            className="text-xs gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Receipt className="w-3.5 h-3.5 text-orange-600" />
            <span>Payrun Batches ({payruns.length})</span>
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/payroll/payruns/new')}
              className="text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Run New Payroll</span>
            </Button>
          )}
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Monthly Payroll Commitment */}
        <Card hover padding="tight" className="bg-gradient-to-br from-white to-orange-50/30 border-orange-100/80">
          <div className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
                Monthly Commitment
              </span>
              <div className="p-2 rounded-xl bg-orange-100/80 text-orange-600 border border-orange-200">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalMonthlyCommitment)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <Users className="w-3.5 h-3.5 text-orange-500" />
                <span>Across {contracts.length} active contract{contracts.length === 1 ? '' : 's'}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 2: Completed Net Disbursed */}
        <Card hover padding="tight" className="bg-gradient-to-br from-white to-emerald-50/30 border-emerald-100/80">
          <div className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Total Disbursed (Net)
              </span>
              <div className="p-2 rounded-xl bg-emerald-100/80 text-emerald-600 border border-emerald-200">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalDisbursedNet)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>{paidPayslips.length} payslips paid ({payrunMetrics.paid || 0} batches)</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 3: In-Pipeline / Pending Disbursement */}
        <Card hover padding="tight" className="bg-gradient-to-br from-white to-amber-50/30 border-amber-100/80">
          <div className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Pending Pipeline
              </span>
              <div className="p-2 rounded-xl bg-amber-100/80 text-amber-600 border border-amber-200">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalPendingPayout)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span>{(payrunMetrics.computed || 0) + (payrunMetrics.validated || 0)} batch(es) awaiting payout</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4: Statutory Deductions & Taxes */}
        <Card hover padding="tight" className="bg-gradient-to-br from-white to-blue-50/30 border-blue-100/80">
          <div className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800">
                Statutory Withheld
              </span>
              <div className="p-2 rounded-xl bg-blue-100/80 text-blue-600 border border-blue-200">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {formatCurrency(totalStatutoryDeductions)}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500 font-medium">
                <span className="text-blue-600 font-semibold">PF & PT</span>
                <span>statutory deductions</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Active Cycle Spotlight Banner */}
      {activePayrun && (
        <Card className="border border-orange-200/90 bg-gradient-to-r from-orange-50/60 via-white to-slate-50/60 p-6 rounded-2xl shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 border border-orange-200">
                  Active Cycle Spotlight
                </span>
                {getStatusBadge(activePayrun.status)}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activePayrun.name}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Period: <span className="font-semibold text-slate-800">{formatDate(activePayrun.periodStart)} – {formatDate(activePayrun.periodEnd)}</span>
                  {' '}• Structure: <span className="font-semibold text-slate-800">{activePayrun.structureName}</span>
                </p>
              </div>

              {/* Stepper indicator */}
              <div className="flex items-center gap-2 pt-2 text-[11px] font-semibold text-slate-500">
                {['draft', 'computed', 'validated', 'paid'].map((st, idx) => {
                  const stages = ['draft', 'computed', 'validated', 'paid'];
                  const curIdx = stages.indexOf((activePayrun.status || '').toLowerCase());
                  const isDone = curIdx >= idx;
                  const isCurrent = curIdx === idx;
                  return (
                    <React.Fragment key={st}>
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md ${
                        isCurrent
                          ? 'bg-orange-600 text-white font-bold shadow-xs'
                          : isDone
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        {isDone && !isCurrent ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                        <span className="capitalize">{st}</span>
                      </div>
                      {idx < 3 && <span className="text-slate-300">→</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="text-left lg:text-right">
                <span className="text-[11px] text-slate-500 block">Enrolled Workforce</span>
                <span className="text-base font-bold text-slate-900">
                  {activePayrun.employeeCount || 0} Employee{(activePayrun.employeeCount || 0) === 1 ? '' : 's'}
                </span>
              </div>

              <Button
                variant="primary"
                onClick={() => navigate(`/payroll/payruns/${activePayrun.id}`)}
                className="gap-2 bg-orange-600 hover:bg-orange-700 text-xs shadow-sm"
              >
                <span>Manage This Cycle</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Two-Column Middle Section: Structure Breakdown & Quick Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Monthly Commitment by Salary Structure */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-orange-600" />
                  <CardTitle>Monthly Payroll Spend by Salary Structure</CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/payroll/salary-structures')}
                  className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1 p-0 h-auto"
                >
                  <span>Manage Structures</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
              <CardSubtitle>
                Active employee wage commitment grouped by assigned salary configuration.
              </CardSubtitle>
            </CardHeader>

            <CardBody className="p-6 space-y-5">
              {structureSpendList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4">No active contracts assigned to structures.</p>
              ) : (
                structureSpendList.map((st) => {
                  const percent = totalMonthlyCommitment > 0
                    ? Math.round((st.totalWage / totalMonthlyCommitment) * 100)
                    : 0;
                  return (
                    <div
                      key={st.id}
                      className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/40 transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{st.name}</span>
                            {st.code && (
                              <Badge variant="neutral" className="font-mono text-[10px] bg-white">
                                {st.code}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 mt-0.5 block">
                            {st.employeeCount} active employee{st.employeeCount === 1 ? '' : 's'} assigned
                          </span>
                        </div>

                        <div className="text-left sm:text-right">
                          <span className="text-base font-black text-slate-900 tracking-tight">
                            {formatCurrency(st.totalWage)}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium block">
                            {percent}% of monthly budget
                          </span>
                        </div>
                      </div>

                      {/* Visual progress bar */}
                      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-700"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right 1 Col: Operational Hub & Workforce Coverage */}
        <div className="space-y-4">
          <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/50 px-6 py-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                <CardTitle>Payroll Operations Hub</CardTitle>
              </div>
              <CardSubtitle>Quick shortcuts & configuration</CardSubtitle>
            </CardHeader>

            <CardBody className="p-6 space-y-3">
              {/* Coverage summary */}
              <div className="p-3.5 rounded-xl bg-orange-50/60 border border-orange-100 text-xs text-orange-950 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>Enrolled Payroll Coverage</span>
                  <span className="text-orange-700">{contracts.length} Active Contracts</span>
                </div>
                <p className="text-[11px] text-orange-800 leading-relaxed">
                  All active contracts have linked salary structures and are ready for upcoming payruns.
                </p>
              </div>

              {/* Navigation Quick Links */}
              <div className="space-y-2 pt-2">
                <Link
                  to="/payroll/payruns"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs text-slate-700 hover:text-orange-900 font-medium group"
                >
                  <div className="flex items-center gap-2.5">
                    <Receipt className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    <span>Payrun Batches List</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/payroll/payslips"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs text-slate-700 hover:text-orange-900 font-medium group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    <span>Payslips Directory</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/payroll/salary-structures"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs text-slate-700 hover:text-orange-900 font-medium group"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    <span>Salary Structures ({structures.length})</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/payroll/salary-rules"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs text-slate-700 hover:text-orange-900 font-medium group"
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    <span>Salary Rules (Basic, HRA, PF, PT)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/payroll/salary-rule-categories"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs text-slate-700 hover:text-orange-900 font-medium group"
                >
                  <div className="flex items-center gap-2.5">
                    <FolderKanban className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    <span>Rule Categories</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>

                <Link
                  to="/contracts"
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-xs text-slate-700 hover:text-orange-900 font-medium group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-orange-600" />
                    <span>Employee Contracts</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-orange-600 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Bottom Section: Recent Payrun Cycles Table */}
      <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
        <CardHeader className="bg-slate-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-600" />
              <CardTitle>Recent Payrun Batches</CardTitle>
            </div>
            <Link
              to="/payroll/payruns"
              className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All Payruns ({payruns.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <CardSubtitle>
            Historical and in-progress payrun batches processed by the HR Payroll department.
          </CardSubtitle>
        </CardHeader>

        {payruns.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No payrun batches generated yet. Click "Run New Payroll" above to initiate your first cycle.
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/70">
                <Table.HeaderCell>Payrun Batch</Table.HeaderCell>
                <Table.HeaderCell>Salary Structure</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
                <Table.HeaderCell>Employees</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payruns.slice(0, 5).map((pr) => (
                <Table.Row key={pr.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <div>
                      <Link
                        to={`/payroll/payruns/${pr.id}`}
                        className="font-bold text-slate-800 hover:text-orange-600 text-xs block"
                      >
                        {pr.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        ID: {pr.id}
                      </span>
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-orange-500" />
                      <span className="text-xs font-medium text-slate-700">
                        {pr.structureName}
                      </span>
                      {pr.structureCode && (
                        <Badge variant="neutral" className="font-mono text-[10px]">
                          {pr.structureCode}
                        </Badge>
                      )}
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs text-slate-600">
                      {formatDate(pr.periodStart)} – {formatDate(pr.periodEnd)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge variant="neutral" className="text-[11px]">
                      {pr.employeeCount || 0} Employees
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    {getStatusBadge(pr.status)}
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/payroll/payruns/${pr.id}`)}
                      className="text-xs text-slate-600 hover:text-orange-600 gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* Recent Disbursed Payslips Preview */}
      {payslips.length > 0 && (
        <Card className="border border-slate-200 bg-white rounded-xl shadow-xs overflow-hidden">
          <CardHeader className="bg-slate-50/50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <CardTitle>Recent Employee Payslips</CardTitle>
              </div>
              <Link
                to="/payroll/payslips"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Payslips Directory ({payslips.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <CardSubtitle>
              Individual employee payslips calculated and disbursed across payruns.
            </CardSubtitle>
          </CardHeader>

          <Table>
            <Table.Header>
              <Table.Row className="bg-slate-50/70">
                <Table.HeaderCell>Employee</Table.HeaderCell>
                <Table.HeaderCell>Period</Table.HeaderCell>
                <Table.HeaderCell>Gross Salary</Table.HeaderCell>
                <Table.HeaderCell>Deductions</Table.HeaderCell>
                <Table.HeaderCell>Net Pay</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell className="text-right">Action</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {payslips.slice(0, 5).map((ps) => (
                <Table.Row key={ps.id} className="hover:bg-slate-50/60 transition-colors">
                  <Table.Cell>
                    <div>
                      <span className="font-semibold text-slate-800 text-xs block">
                        {ps.employeeName}
                      </span>
                      {ps.employeeCode && (
                        <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                          {ps.employeeCode}
                        </span>
                      )}
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs text-slate-600">
                      {formatDate(ps.periodStart)} – {formatDate(ps.periodEnd)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-semibold text-slate-800">
                      {formatCurrency(ps.grossSalary)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-semibold text-rose-600">
                      -{formatCurrency(ps.totalDeductions)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    <span className="text-xs font-bold text-emerald-700">
                      {formatCurrency(ps.netSalary)}
                    </span>
                  </Table.Cell>

                  <Table.Cell>
                    {getStatusBadge(ps.status)}
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/payroll/payslips')}
                      className="text-xs text-blue-600 hover:text-blue-700 gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Card>
      )}
    </div>
  );
}
