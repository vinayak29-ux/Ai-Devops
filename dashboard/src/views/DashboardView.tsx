import React, { useState } from 'react';
import type { Deployment, RiskLevel } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Rocket, 
  ShieldCheck, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  GitBranch, 
  ArrowUpRight,
  Search,
  Filter
} from 'lucide-react';

interface DashboardViewProps {
  deployments: Deployment[];
  onSelectDeployment: (deployment: Deployment) => void;
  onNavigateToApprovals: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  deployments,
  onSelectDeployment,
  onNavigateToApprovals,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'all'>('all');

  // Stats calculation
  const totalDeployments = deployments.length;
  const lowRiskCount = deployments.filter((d) => d.risk === 'low').length;
  const mediumRiskCount = deployments.filter((d) => d.risk === 'medium').length;
  const highRiskCount = deployments.filter((d) => d.risk === 'high').length;
  const pendingApprovalsCount = deployments.filter((d) => d.status === 'waiting_approval').length;

  // Filtered table rows
  const filteredDeployments = deployments.filter((d) => {
    const matchesSearch =
      d.repository.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.commitMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.commitSha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.actor.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRisk = selectedRisk === 'all' || d.risk === selectedRisk;
    return matchesSearch && matchesRisk;
  });

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Deployment Operations
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Real-time monitoring and deployment decision pipeline driven by AI risk assessment.
          </p>
        </div>

        {pendingApprovalsCount > 0 && (
          <button
            onClick={onNavigateToApprovals}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium hover:bg-rose-500/20 transition-all cursor-pointer shadow-xs"
          >
            <Clock className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>{pendingApprovalsCount} Action Required</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Deployments */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700/80 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono font-medium text-zinc-400 uppercase tracking-wider">
              Total Runs
            </span>
            <Rocket className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white tracking-tight">
              {totalDeployments}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Pipeline executions</p>
          </div>
        </div>

        {/* Low Risk */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-emerald-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-wider">
              Low Risk
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
              {lowRiskCount}
            </div>
            <p className="text-[11px] text-emerald-500/80 mt-0.5">Auto-deployed via Netlify</p>
          </div>
        </div>

        {/* Medium Risk */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono font-medium text-amber-400 uppercase tracking-wider">
              Medium Risk
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
              {mediumRiskCount}
            </div>
            <p className="text-[11px] text-amber-500/80 mt-0.5">Requires audit gate</p>
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-rose-500/30 transition-all">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono font-medium text-rose-400 uppercase tracking-wider">
              High Risk
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-rose-300 tracking-tight">
              {highRiskCount}
            </div>
            <p className="text-[11px] text-rose-500/80 mt-0.5">Flagged for inspection</p>
          </div>
        </div>

        {/* Pending Approvals */}
        <div 
          onClick={onNavigateToApprovals}
          className={`col-span-2 sm:col-span-1 bg-zinc-900/60 border rounded-xl p-4 flex flex-col justify-between transition-all cursor-pointer ${
            pendingApprovalsCount > 0 
              ? 'border-amber-500/40 hover:border-amber-400 bg-amber-500/5' 
              : 'border-zinc-800/80 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-mono font-medium text-amber-400 uppercase tracking-wider">
              Pending Gate
            </span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-300 tracking-tight flex items-center gap-2">
              {pendingApprovalsCount}
              {pendingApprovalsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1">
              Awaiting operator review →
            </p>
          </div>
        </div>
      </div>

      {/* Recent Deployments Table Section */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden shadow-sm">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/60">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">
              Recent Pipeline Deployments
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Inspected GitHub commits and autonomous release decisions
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search repo, commit, sha..."
                className="w-48 sm:w-60 pl-8 pr-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500/60 transition-colors"
              />
            </div>

            <div className="flex items-center bg-zinc-950/80 border border-zinc-800 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setSelectedRisk('all')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedRisk === 'all' ? 'bg-zinc-800 text-white font-medium' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRisk('low')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedRisk === 'low' ? 'bg-emerald-500/20 text-emerald-400 font-medium' : 'text-zinc-400 hover:text-emerald-400'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setSelectedRisk('medium')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedRisk === 'medium' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-zinc-400 hover:text-amber-400'
                }`}
              >
                Med
              </button>
              <button
                onClick={() => setSelectedRisk('high')}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedRisk === 'high' ? 'bg-rose-500/20 text-rose-400 font-medium' : 'text-zinc-400 hover:text-rose-400'
                }`}
              >
                High
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 bg-zinc-950/40 text-zinc-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 font-medium">Repository</th>
                <th className="py-3 px-4 font-medium">Commit & Author</th>
                <th className="py-3 px-4 font-medium">Risk Level</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Time</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredDeployments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400">
                    <Filter className="w-6 h-6 mx-auto mb-2 text-zinc-400" />
                    <p className="text-sm font-medium text-zinc-400">No deployments found</p>
                    <p className="text-xs text-zinc-400 mt-1">Try changing your search query or risk filter</p>
                  </td>
                </tr>
              ) : (
                filteredDeployments.map((deployment) => (
                  <tr
                    key={deployment.id}
                    onClick={() => onSelectDeployment(deployment)}
                    className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
                  >
                    {/* Repository */}
                    <td className="py-3.5 px-4 font-medium text-zinc-200">
                      <div className="flex items-center gap-2">
                        <span className="text-white group-hover:text-indigo-300 transition-colors font-semibold">
                          {deployment.repository}
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          <GitBranch className="w-2.5 h-2.5" />
                          {deployment.branch}
                        </span>
                      </div>
                    </td>

                    {/* Commit */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-indigo-400 bg-indigo-500/10 px-1 rounded text-[11px]">
                            {deployment.commitSha}
                          </span>
                          <span className="text-zinc-200 truncate font-normal">
                            {deployment.commitMessage}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400">
                          by @{deployment.actor}
                        </span>
                      </div>
                    </td>

                    {/* Risk */}
                    <td className="py-3.5 px-4">
                      <RiskBadge risk={deployment.risk} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <StatusBadge status={deployment.status} size="sm" />
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-right font-mono text-zinc-400 text-[11px]">
                      {formatRelativeTime(deployment.commitTimestamp)}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDeployment(deployment);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-medium transition-colors"
                      >
                        Inspect
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
