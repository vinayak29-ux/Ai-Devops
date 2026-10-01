from datetime import datetime, timezone
from enum import StrEnum
from uuid import uuid4

from pydantic import BaseModel, Field


class EventType(StrEnum):
    PUSH = "push"
    PULL_REQUEST = "pull_request"
    RELEASE = "release"
    WORKFLOW_RUN = "workflow_run"
    UNKNOWN = "unknown"


class RiskLevel(StrEnum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RunStatus(StrEnum):
    RECEIVED = "received"
    ANALYZED = "analyzed"
    DEPLOYED = "deployed"
    WAITING_APPROVAL = "waiting_approval"
    APPROVED = "approved"
    FAILED = "failed"


class GitHubEvent(BaseModel):
    event_type: EventType
    delivery_id: str
    repository: str
    branch: str | None = None
    actor: str | None = None
    commit_sha: str | None = None
    commit_timestamp: str | None = None
    title: str | None = None
    url: str | None = None
    workflow_name: str | None = None
    workflow_conclusion: str | None = None
    changed_files: list[str] = Field(default_factory=list)
    raw: dict


class AiAssessment(BaseModel):
    category: str = "unknown"
    risk: RiskLevel = RiskLevel.MEDIUM
    summary: str = "No summary available."
    release_notes: str = ""
    incident_summary: str = ""
    recommended_actions: list[str] = Field(default_factory=list)
    jira_title: str = "Review deployment risk"
    jira_description: str = ""


class RunRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    delivery_id: str
    event_type: EventType
    repository: str
    status: RunStatus = RunStatus.RECEIVED
    risk: RiskLevel | None = None
    summary: str = ""
    jira_issue_key: str | None = None
    notion_page_id: str | None = None
    netlify_deploy_id: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
