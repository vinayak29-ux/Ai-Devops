import React, { useState } from 'react';
import type { Deployment } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  GitBranch, 
  GitCommit, 
  User, 
  Clock, 
  ArrowUpRight,
  Database,
  FileCode2,
  CheckCheck
} from 'lucide-react';

interface ApprovalsViewProps {
  pendingDeployments: Deployment[];
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onSelectDeployment: (deployment: Deployment) => void;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  pendingDeployments,
  onApprove,
  onReject,
  onSelectDeployment,
}) => {
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleApprove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await onApprove(id);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingId(id);
    try {
      await onReject(id, 'Rejected in Approvals queue');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Pending Approvals Queue
            </h1>
            {pendingDeployments.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                {pendingDeployments.length} pending
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            High-risk code changes held by ShipWise AI awaiting manual operator verification before Netlify rollout.
          </p>
        </div>
      </div>

      {/* Approvals List */}
      {pendingDeployments.length === 0 ? (
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">
            Approval Queue is Empty
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1.5">
            All high-risk deployments have been triaged. Low-risk changes continue to deploy autonomously.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingDeployments.map((deployment) => (
            <div
              key={deployment.id}
              onClick={() => onSelectDeployment(deployment)}
              className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-5 transition-all cursor-pointer shadow-xs space-y-4 group"
            >
              {/* Top Row: Repo, Branch, Commit, Risk */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {deployment.repository}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                    <GitBranch className="w-3 h-3 text-zinc-400" />
                    {deployment.branch}
                  </span>
                  <RiskBadge risk={deployment.risk} size="sm" />
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 font-mono">
                  <span className="flex items-center gap-1">
                    <GitCommit className="w-3 h-3 text-zinc-500" />
                    {deployment.commitSha}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-zinc-500" />
                    @{deployment.actor}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    {new Date(deployment.commitTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Commit Message */}
              <div className="text-xs text-zinc-200 font-medium font-sans">
                {deployment.commitMessage}
              </div>

              {/* Reason / AI Risk Explanation Banner (Prompt Requirement) */}
              <div className="p-3.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-rose-400 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Flagged Risk Reason:</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {deployment.aiExplanation}
                </p>
              </div>

              {/* Changed Files summary + Actions */}
              <div className="pt-2 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <span className="text-zinc-500">Affects {deployment.changedFiles.length} files:</span>
                  <div className="flex items-center gap-1.5 truncate max-w-sm">
                    {deployment.changedFiles.slice(0, 2).map((f, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] truncate">
                        {f.path.split('/').pop()}
                      </span>
                    ))}
                    {deployment.changedFiles.length > 2 && (
                      <span className="text-[10px] text-zinc-500">
                        +{deployment.changedFiles.length - 2} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Approve / Reject Actions (Prompt Requirement) */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDeployment(deployment);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
                  >
                    Inspect
                  </button>

                  <button
                    onClick={(e) => handleReject(deployment.id, e)}
                    disabled={processingId === deployment.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800/60 text-zinc-300 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>

                  <button
                    onClick={(e) => handleApprove(deployment.id, e)}
                    disabled={processingId === deployment.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
