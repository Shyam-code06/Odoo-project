import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Check, X, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardSubtitle, CardBody } from '../../../components/ui/Card';
import { Avatar } from '../../../components/ui/Avatar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button } from '../../../components/ui/Button';
import { IconButton } from '../../../components/ui/IconButton';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/ui/Toast';
import { PERMISSIONS } from '../../../config/permissions';

export const TimeOffRequestsWidget = ({ requests = [], onApprove, onReject }) => {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [processingId, setProcessingId] = useState(null);

  const canApprove = hasPermission(PERMISSIONS.TIME_OFF_APPROVE);

  const handleApproveAction = async (id, name) => {
    setProcessingId(id);
    try {
      await onApprove(id);
      toast.success(`Approved time-off request for ${name}`);
    } catch (e) {
      toast.error('Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectAction = async (id, name) => {
    setProcessingId(id);
    try {
      await onReject(id);
      toast.info(`Rejected time-off request for ${name}`);
    } catch (e) {
      toast.error('Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className=" flex flex-col justify-between" padding="none">
      <CardHeader className="p-4 sm:p-6 pb-3">
        <div>
          <CardTitle>Pending Time-Off Requests</CardTitle>
          <CardSubtitle>Leave requests awaiting authorization</CardSubtitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          rightIcon={ArrowUpRight}
          onClick={() => navigate('/time-off/requests')}
        >
          View All
        </Button>
      </CardHeader>

      <CardBody className="p-0 divide-y divide-slate-100">
        {requests.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">
            No pending time-off requests at this time.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar src={req.avatar} name={req.employeeName} size="md" />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {req.employeeName}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="font-medium text-orange-600">{req.leaveType}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {req.dates} ({req.days}d)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={req.status} size="sm" />
                {canApprove && req.status === 'Pending' && (
                  <div className="flex items-center gap-1 pl-1">
                    <IconButton
                      icon={Check}
                      ariaLabel="Approve leave"
                      variant="secondary"
                      size="sm"
                      className="text-emerald-600 hover:bg-emerald-50"
                      isDisabled={processingId === req.id}
                      onClick={() => handleApproveAction(req.id, req.employeeName)}
                    />
                    <IconButton
                      icon={X}
                      ariaLabel="Reject leave"
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      isDisabled={processingId === req.id}
                      onClick={() => handleRejectAction(req.id, req.employeeName)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardBody>
    </Card>
  );
};
