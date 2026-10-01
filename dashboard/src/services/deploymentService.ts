import { INITIAL_DEPLOYMENTS, INITIAL_REPOSITORIES } from '../data/mockData';
import type { Deployment, Repository } from '../types';

// In-memory state so user actions (Approve, Reject, Deploy) persist in session
let deploymentsState: Deployment[] = [...INITIAL_DEPLOYMENTS];
let repositoriesState: Repository[] = [...INITIAL_REPOSITORIES];

export const deploymentService = {
  // Fetch all deployments
  async getDeployments(): Promise<Deployment[]> {
    // If backend integration is enabled in future:
    // const res = await fetch(`${API_BASE}/runs`);
    return new Promise((resolve) => {
      setTimeout(() => resolve([...deploymentsState]), 150);
    });
  },

  // Fetch deployment by ID
  async getDeploymentById(id: string): Promise<Deployment | null> {
    const deployment = deploymentsState.find((d) => d.id === id);
    return new Promise((resolve) => {
      setTimeout(() => resolve(deployment || null), 100);
    });
  },

  // Fetch high-risk pending approvals
  async getPendingApprovals(): Promise<Deployment[]> {
    const pending = deploymentsState.filter((d) => d.status === 'waiting_approval');
    return new Promise((resolve) => {
      setTimeout(() => resolve(pending), 100);
    });
  },

  // Fetch repositories
  async getRepositories(): Promise<Repository[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve([...repositoriesState]), 120);
    });
  },

  // Approve high-risk deployment
  async approveDeployment(id: string): Promise<Deployment> {
    const idx = deploymentsState.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Deployment not found');

    const updated: Deployment = {
      ...deploymentsState[idx],
      status: 'approved',
      updatedAt: new Date().toISOString(),
    };
    deploymentsState[idx] = updated;

    // Update repository status if matching
    const repoIdx = repositoriesState.findIndex((r) => r.fullName === updated.repository);
    if (repoIdx !== -1) {
      repositoriesState[repoIdx] = {
        ...repositoriesState[repoIdx],
        currentStatus: 'approved',
        lastDeploymentTime: updated.updatedAt,
      };
    }

    return new Promise((resolve) => setTimeout(() => resolve(updated), 200));
  },

  // Reject deployment
  async rejectDeployment(id: string, reason?: string): Promise<Deployment> {
    const idx = deploymentsState.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Deployment not found');

    const updated: Deployment = {
      ...deploymentsState[idx],
      status: 'rejected',
      summary: reason ? `${deploymentsState[idx].summary} (Rejected: ${reason})` : deploymentsState[idx].summary,
      updatedAt: new Date().toISOString(),
    };
    deploymentsState[idx] = updated;

    const repoIdx = repositoriesState.findIndex((r) => r.fullName === updated.repository);
    if (repoIdx !== -1) {
      repositoriesState[repoIdx] = {
        ...repositoriesState[repoIdx],
        currentStatus: 'rejected',
      };
    }

    return new Promise((resolve) => setTimeout(() => resolve(updated), 200));
  },

  // Trigger Netlify Deploy
  async triggerDeploy(id: string): Promise<Deployment> {
    const idx = deploymentsState.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Deployment not found');

    const updated: Deployment = {
      ...deploymentsState[idx],
      status: 'deployed',
      netlifyDeployId: `net_dep_${Math.random().toString(36).substring(2, 9)}`,
      updatedAt: new Date().toISOString(),
    };
    deploymentsState[idx] = updated;

    const repoIdx = repositoriesState.findIndex((r) => r.fullName === updated.repository);
    if (repoIdx !== -1) {
      repositoriesState[repoIdx] = {
        ...repositoriesState[repoIdx],
        currentStatus: 'deployed',
        lastDeploymentTime: updated.updatedAt,
      };
    }

    return new Promise((resolve) => setTimeout(() => resolve(updated), 300));
  },
};
