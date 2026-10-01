export type RiskLevel = 'low' | 'medium' | 'high';

export type DeploymentStatus = 
  | 'deployed' 
  | 'waiting_approval' 
  | 'approved' 
  | 'rejected' 
  | 'failed';

export interface ChangedFile {
  path: string;
  status: 'modified' | 'added' | 'removed';
  additions: number;
  deletions: number;
}

export interface Deployment {
  id: string;
  deliveryId: string;
  repository: string;
  branch: string;
  actor: string;
  avatarUrl?: string;
  commitSha: string;
  commitMessage: string;
  commitTimestamp: string;
  status: DeploymentStatus;
  risk: RiskLevel;
  summary: string;
  aiExplanation: string;
  changedFiles: ChangedFile[];
  notionPageId?: string;
  notionUrl?: string;
  netlifyDeployId?: string | null;
  jiraIssueKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  branch: string;
  description: string;
  lastDeploymentTime: string;
  lastCommitSha: string;
  lastCommitMessage: string;
  currentStatus: DeploymentStatus;
  currentRisk: RiskLevel;
  autoDeployEnabled: boolean;
}

export type ActiveTab = 'dashboard' | 'approvals' | 'repositories' | 'deployment-details';
