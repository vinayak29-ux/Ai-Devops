import React from 'react';
import type { RiskLevel } from '../../types';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

interface RiskBadgeProps {
  risk: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ risk, showIcon = true, size = 'md' }) => {
  const configs = {
    low: {
      label: 'LOW RISK',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      dot: 'bg-emerald-400',
      icon: ShieldCheck,
    },
    medium: {
      label: 'MEDIUM RISK',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      dot: 'bg-amber-400',
      icon: AlertTriangle,
    },
    high: {
      label: 'HIGH RISK',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/25',
      text: 'text-rose-400',
      dot: 'bg-rose-400',
      icon: ShieldAlert,
    },
  };

  const config = configs[risk] || configs.medium;
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.border} ${config.text} ${sizeClasses[size]} tracking-wider uppercase font-mono shadow-xs select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0 animate-pulse`} />
      {showIcon && <Icon className={size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} />}
      <span>{config.label}</span>
    </span>
  );
};
