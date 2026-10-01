import React from 'react';
import type { ActiveTab } from '../../types';
import { Bot, GitCommit, CheckSquare, FolderGit2, ExternalLink, RefreshCw, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  pendingApprovalsCount: number;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  pendingApprovalsCount,
  onRefresh,
  isRefreshing = false,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand + Agent Info */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => onTabChange('dashboard')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 via-zinc-800 to-zinc-900 border border-zinc-700/60 flex items-center justify-center text-indigo-400 shadow-inner group-hover:border-indigo-500/50 transition-colors">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm tracking-tight text-white group-hover:text-zinc-200 transition-colors">
                    ShipWise AI
                  </span>
                  <span className="px-1.5 py-0.5 text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                    Agent
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-mono">
                  Autonomous DevOps
                </p>
              </div>
            </div>

            {/* Workflow Pipeline Breadcrumb (Linear Style) */}
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 border-l border-zinc-800 pl-6">
              <span className="text-zinc-400 flex items-center gap-1">
                <GitCommit className="w-3 h-3" /> GitHub
              </span>
              <span>→</span>
              <span className="text-indigo-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Gemini AI
              </span>
              <span>→</span>
              <span className="text-emerald-400">Netlify Auto</span>
              <span>/</span>
              <span className="text-amber-400">Approval</span>
              <span>→</span>
              <span className="text-zinc-300">Notion Audit</span>
            </div>
          </div>

          {/* Center: Tabs */}
          <nav className="flex items-center gap-1 bg-zinc-900/60 p-1 rounded-lg border border-zinc-800/80">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              onClick={() => onTabChange('approvals')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all relative ${
                activeTab === 'approvals'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Approvals
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 ml-0.5">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('repositories')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'repositories'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
              }`}
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              Repositories
            </button>
          </nav>

          {/* Right: Status Pill & Notion Link */}
          <div className="flex items-center gap-3">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                title="Refresh deployment data"
                className="p-2 rounded-md border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
              </button>
            )}

            {/* Notion audit database shortcut */}
            <a
              href="https://www.notion.so"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Notion Synced
              <ExternalLink className="w-3 h-3 text-zinc-500" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
