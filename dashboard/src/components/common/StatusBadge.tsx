import React from 'react';
import type { DeploymentStatus } from '../../types';
import { CheckCircle2, Clock, Check, XCircle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: DeploymentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    DeploymentStatus,
    { label: string; bg: string; border: string; text: string; icon: React.ElementType }
  > = {
    deployed: {
      label: 'Deployed',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-700/30',
      text: 'text-emerald-300',
      icon: CheckCircle2,
    },
    waiting_approval: {
      label: 'Pending Approval',
      bg: 'bg-amber-950/40',
      border: 'border-amber-700/30',
      text: 'text-amber-300',
      icon: Clock,
    },
    approved: {
      label: 'Approved',
      bg: 'bg-sky-950/40',
      border: 'border-sky-700/30',
      text: 'text-sky-300',
      icon: Check,
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-zinc-900',
      border: 'border-zinc-800',
      text: 'text-zinc-400',
      icon: XCircle,
    },
    failed: {
      label: 'Failed',
      bg: 'bg-rose-950/40',
      border: 'border-rose-700/30',
      text: 'text-rose-300',
      icon: AlertCircle,
    },
  };

  const config = configs[status] || configs.waiting_approval;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]} select-none`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{config.label}</span>
    </span>
  );
};
