import React, { useState } from 'react';
import type { Deployment } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ArrowLeft,
  GitCommit,
  GitBranch,
  User,
  Clock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Rocket,
  FileCode2,
  FilePlus2,
  FileMinus2,
  Database,
  ShieldAlert,
  Copy,
  Check,
  Cpu
} from 'lucide-react';

interface DeploymentDetailsViewProps {
  deployment: Deployment;
  onBack: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason?: string) => Promise<void>;
  onDeploy: (id: string) => Promise<void>;
}

export const DeploymentDetailsView: React.FC<DeploymentDetailsViewProps> = ({
  deployment,
  onBack,
  onApprove,
  onReject,
  onDeploy,
}) => {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleCopySha = () => {
    navigator.clipboard.writeText(deployment.commitSha);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(deployment.id);
      setActionSuccess('Deployment approved successfully.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onReject(deployment.id, 'Operator rejected due to high risk assessment');
      setActionSuccess('Deployment rejected.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeploy = async () => {
    setIsProcessing(true);
    try {
      await onDeploy(deployment.id);
      setActionSuccess('Deployment triggered to Netlify.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (filePath: string) => {
    if (filePath.includes('sql') || filePath.includes('migration')) {
      return <Database className="w-4 h-4 text-amber-400" />;
    }
    return <FileCode2 className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Deployments</span>
        </button>

        <div className="flex items-center gap-2">
          {/* View in Notion Button (Prompt Requirement) */}
          <a
            href={deployment.notionUrl || 'https://www.notion.so'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-200 bg-zinc-900 border border-zinc-700/80 hover:bg-zinc-800 hover:text-white transition-all shadow-xs cursor-pointer"
          >
            <span>View in Notion</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-xs text-indigo-300 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-zinc-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-lg font-bold text-white tracking-tight">
                {deployment.repository}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                <GitBranch className="w-3 h-3 text-zinc-400" />
                {deployment.branch}
              </span>
              <StatusBadge status={deployment.status} size="md" />
              <RiskBadge risk={deployment.risk} size="md" />
            </div>

            <h2 className="text-base font-medium text-zinc-200">
              {deployment.commitMessage}
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 font-mono pt-1">
              <div className="flex items-center gap-1.5">
                <GitCommit className="w-3.5 h-3.5 text-zinc-500" />
                <button
                  onClick={handleCopySha}
                  className="flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded hover:bg-indigo-500/20 transition-colors"
                  title="Copy SHA"
                >
                  <span>{deployment.commitSha}</span>
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>@{deployment.actor}</span>
              </div>

              <div className="flex items-center gap-1.5 text-zinc-400">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                <span>{new Date(deployment.commitTimestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Control Panel (Prompt Requirement: Approve / Reject / Deploy) */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0 pt-2 md:pt-0">
            {deployment.status === 'waiting_approval' && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve Deployment
                </button>

                <button
                  onClick={handleReject}
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-800 border border-zinc-700 text-zinc-300 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Change
                </button>
              </>
            )}

            {deployment.status !== 'deployed' && deployment.status !== 'rejected' && (
              <button
                onClick={handleDeploy}
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <Rocket className="w-4 h-4" />
                Deploy to Netlify
              </button>
            )}

            {deployment.status === 'deployed' && (
              <div className="px-3 py-2 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Live on Netlify ({deployment.netlifyDeployId || 'auto'})</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Risk Assessment Card (Prompt Requirement) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              AI Risk Assessment
            </h3>
          </div>
          <RiskBadge risk={deployment.risk} size="lg" />
        </div>

        <div className="space-y-3">
          <div>
            <h4 className="text-xs font-mono uppercase text-zinc-500 tracking-wider">
              Summary
            </h4>
            <p className="text-sm text-zinc-200 mt-1 leading-relaxed font-normal">
              {deployment.summary}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-zinc-950/80 border border-zinc-800/80">
            <h4 className="text-xs font-mono uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Automated Risk Analysis Explanation
            </h4>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">
              {deployment.aiExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Changed Files Card (Prompt Requirement) */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Changed Files ({deployment.changedFiles.length})
            </h3>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            Git diff inspection
          </span>
        </div>

        <div className="divide-y divide-zinc-800/60">
          {deployment.changedFiles.map((file, idx) => (
            <div
              key={idx}
              className="p-3.5 px-4 flex items-center justify-between hover:bg-zinc-800/20 transition-colors text-xs font-mono"
            >
              <div className="flex items-center gap-2.5 text-zinc-300">
                {getFileIcon(file.path)}
                <span className="truncate">{file.path}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {file.status === 'added' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Added
                  </span>
                )}
                {file.status === 'modified' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    Modified
                  </span>
                )}
                {file.status === 'removed' && (
                  <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Removed
                  </span>
                )}

                <div className="flex items-center gap-1.5 text-[11px] pl-2 border-l border-zinc-800">
                  <span className="text-emerald-400 flex items-center">
                    <FilePlus2 className="w-3 h-3 mr-0.5" />
                    +{file.additions}
                  </span>
                  <span className="text-rose-400 flex items-center">
                    <FileMinus2 className="w-3 h-3 mr-0.5" />
                    -{file.deletions}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notion Audit Footer Notice */}
      <div className="p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400">
        <div>
          <span className="text-zinc-300 font-medium">Notion Integration Note:</span>{' '}
          Full audit logs, incident histories, and generated release notes are stored in Notion.
        </div>
        <a
          href={deployment.notionUrl || 'https://www.notion.so'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium shrink-0"
        >
          Open Notion Record <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
