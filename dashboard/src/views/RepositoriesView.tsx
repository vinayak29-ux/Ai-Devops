import React from 'react';
import type { Repository, Deployment } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  FolderGit2, 
  GitBranch, 
  GitCommit, 
  Clock, 
  ExternalLink, 
  Zap, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface RepositoriesViewProps {
  repositories: Repository[];
  deployments: Deployment[];
  onSelectDeployment: (deployment: Deployment) => void;
  onFilterByRepository: (repoName: string) => void;
}

export const RepositoriesView: React.FC<RepositoriesViewProps> = ({
  repositories,
  deployments,
  onSelectDeployment,
  onFilterByRepository,
}) => {
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

  const handleViewLatest = (repoFullName: string) => {
    const latest = deployments.find((d) => d.repository === repoFullName);
    if (latest) {
      onSelectDeployment(latest);
    } else {
      onFilterByRepository(repoFullName);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Connected Repositories
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            GitHub repositories actively monitored by ShipWise AI for commit webhooks, PR events, and automated risk analysis.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Webhook Active (Port 8001)</span>
        </div>
      </div>

      {/* Repositories Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {repositories.map((repo) => {
          const repoDeployments = deployments.filter((d) => d.repository === repo.fullName);
          const latestDeployment = repoDeployments[0];

          return (
            <div
              key={repo.id}
              className="bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs space-y-4 group"
            >
              {/* Card Header: Repo Name + Branch + GitHub Link */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 group-hover:text-indigo-400 group-hover:border-indigo-500/40 transition-colors">
                      <FolderGit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                          {repo.name}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
                          <GitBranch className="w-2.5 h-2.5" />
                          {repo.branch}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                        {repo.fullName}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://github.com/${repo.fullName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open on GitHub"
                    className="p-1.5 text-zinc-500 hover:text-white rounded hover:bg-zinc-800 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {repo.description}
                </p>
              </div>

              {/* Status & Risk Pill */}
              <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-mono text-[11px]">Current State:</span>
                  <div className="flex items-center gap-2">
                    <RiskBadge risk={latestDeployment?.risk || repo.currentRisk} size="sm" />
                    <StatusBadge status={latestDeployment?.status || repo.currentStatus} size="sm" />
                  </div>
                </div>

                {/* Last Deployment details (Prompt Requirement) */}
                <div className="p-3 rounded-lg bg-zinc-950/60 border border-zinc-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-mono text-[11px] text-zinc-400">
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Clock className="w-3 h-3" /> Last deployment:
                    </span>
                    <span className="text-zinc-300 font-medium">
                      {formatRelativeTime(repo.lastDeploymentTime)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-zinc-300 font-mono text-[11px] truncate">
                    <GitCommit className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="text-indigo-400">{repo.lastCommitSha}</span>
                    <span className="text-zinc-400 truncate font-sans text-xs">
                      {repo.lastCommitMessage}
                    </span>
                  </div>
                </div>

                {/* Autonomous Netlify rule */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Auto-deploy low risk:</span>
                    <span className={repo.autoDeployEnabled ? 'text-emerald-400 font-mono' : 'text-zinc-400'}>
                      {repo.autoDeployEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </span>

                  <button
                    onClick={() => handleViewLatest(repo.fullName)}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                  >
                    <span>View Latest</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
