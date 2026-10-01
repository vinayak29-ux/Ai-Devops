import React, { useState, useEffect } from 'react';
import type { ActiveTab, Deployment, Repository } from './types';
import { deploymentService } from './services/deploymentService';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './views/DashboardView';
import { DeploymentDetailsView } from './views/DeploymentDetailsView';
import { ApprovalsView } from './views/ApprovalsView';
import { RepositoriesView } from './views/RepositoriesView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load initial data
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [deps, repos] = await Promise.all([
        deploymentService.getDeployments(),
        deploymentService.getRepositories(),
      ]);
      setDeployments(deps);
      setRepositories(repos);

      // If a deployment is currently selected, refresh its reference
      if (selectedDeployment) {
        const updated = deps.find((d) => d.id === selectedDeployment.id);
        if (updated) setSelectedDeployment(updated);
      }
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Approve action
  const handleApprove = async (id: string) => {
    await deploymentService.approveDeployment(id);
    await loadData();
  };

  // Handle Reject action
  const handleReject = async (id: string, reason?: string) => {
    await deploymentService.rejectDeployment(id, reason);
    await loadData();
  };

  // Handle Deploy action
  const handleDeploy = async (id: string) => {
    await deploymentService.triggerDeploy(id);
    await loadData();
  };

  // Open details for a specific deployment
  const handleSelectDeployment = (deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setActiveTab('deployment-details');
  };

  // Return to previous tab or dashboard
  const handleBackFromDetails = () => {
    setActiveTab('dashboard');
    setSelectedDeployment(null);
  };

  // Pending count for navbar badge
  const pendingApprovalsCount = deployments.filter((d) => d.status === 'waiting_approval').length;
  const pendingDeployments = deployments.filter((d) => d.status === 'waiting_approval');

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* SaaS Navbar */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'deployment-details') {
            setSelectedDeployment(null);
          }
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-zinc-500 font-mono text-xs">
            <span className="animate-pulse">Loading AI DevOps Agent state...</span>
          </div>
        ) : (
          <>
            {/* Screen 1: Dashboard */}
            {activeTab === 'dashboard' && (
              <DashboardView
                deployments={deployments}
                onSelectDeployment={handleSelectDeployment}
                onNavigateToApprovals={() => setActiveTab('approvals')}
              />
            )}

            {/* Screen 2: Deployment Details */}
            {activeTab === 'deployment-details' && selectedDeployment && (
              <DeploymentDetailsView
                deployment={selectedDeployment}
                onBack={handleBackFromDetails}
                onApprove={handleApprove}
                onReject={handleReject}
                onDeploy={handleDeploy}
              />
            )}

            {/* Screen 3: Approvals */}
            {activeTab === 'approvals' && (
              <ApprovalsView
                pendingDeployments={pendingDeployments}
                onApprove={handleApprove}
                onReject={handleReject}
                onSelectDeployment={handleSelectDeployment}
              />
            )}

            {/* Screen 4: Repositories */}
            {activeTab === 'repositories' && (
              <RepositoriesView
                repositories={repositories}
                deployments={deployments}
                onSelectDeployment={handleSelectDeployment}
                onFilterByRepository={() => {
                  setActiveTab('dashboard');
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Subtle SaaS Footer */}
      <footer className="border-t border-zinc-800/60 py-6 px-4 sm:px-8 text-center sm:text-left text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-zinc-400">ShipWise AI DevOps Agent</span>
            <span className="text-zinc-600">•</span>
            <span className="text-zinc-400">Monitoring & Actions</span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            Comprehensive audit reports, commit histories, and deployment logs remain archived in Notion.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
