import logging

import httpx

from app.core.settings import Settings
from app.domain.models import AiAssessment, GitHubEvent, RunRecord

logger = logging.getLogger(__name__)


class NotionClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = "https://api.notion.com/v1"

    async def record_deployment(self, run: RunRecord, event: GitHubEvent, assessment: AiAssessment) -> str | None:
        return await self._create_page(
            self.settings.notion_deployments_database_id,
            {
                "Name": self._title(f"{event.repository} {event.event_type.value}"),
                "Status": self._status(run.status.value),
                "Risk": self._select(assessment.risk.value),
                "Repository": self._rich_text(event.repository),
                "Summary": self._rich_text(assessment.summary[:1900]),
                "Developer": self._rich_text(event.actor or "unknown"),
                "Branch": self._rich_text(event.branch or "unknown"),
                "Commit SHA": self._rich_text((event.commit_sha or "")[:7]),
                "Commit Message": self._rich_text((event.title or "No message")[:500]),
                "Commit Time": self._date(event.commit_timestamp),
                "Changed Files": self._rich_text(
                    ", ".join(event.changed_files[:30]) if event.changed_files else "none"
                ),
                "Commit URL": self._url(event.url),
            },
        )

    async def queue_approval(self, run: RunRecord, event: GitHubEvent, assessment: AiAssessment) -> str | None:
        return await self._create_page(
            self.settings.notion_approvals_database_id,
            {
                "Name": self._title(f"Approve {event.repository} deploy"),
                "Status": self._status("pending"),
                "Risk": self._select(assessment.risk.value),
                "Run ID": self._rich_text(run.id),
                "Summary": self._rich_text(assessment.summary[:1900]),
                "Developer": self._rich_text(event.actor or "unknown"),
                "Branch": self._rich_text(event.branch or "unknown"),
                "Commit SHA": self._rich_text((event.commit_sha or "")[:7]),
                "Commit Message": self._rich_text((event.title or "No message")[:500]),
                "Commit Time": self._date(event.commit_timestamp),
                "Changed Files": self._rich_text(
                    ", ".join(event.changed_files[:30]) if event.changed_files else "none"
                ),
            },
        )

    async def record_incident(self, event: GitHubEvent, assessment: AiAssessment) -> str | None:
        return await self._create_page(
            self.settings.notion_incidents_database_id,
            {
                "Name": self._title(assessment.jira_title),
                "Status": self._status("open"),
                "Repository": self._rich_text(event.repository),
                "Summary": self._rich_text((assessment.incident_summary or assessment.summary)[:1900]),
                "Developer": self._rich_text(event.actor or "unknown"),
                "Branch": self._rich_text(event.branch or "unknown"),
                "Commit Time": self._date(event.commit_timestamp),
            },
        )

    async def record_run_log(self, run: RunRecord, message: str) -> str | None:
        return await self._create_page(
            self.settings.notion_run_logs_database_id,
            {
                "Name": self._title(f"Run {run.id}"),
                "Status": self._status(run.status.value),
                "Run ID": self._rich_text(run.id),
                "Message": self._rich_text(message[:1900]),
                "Developer": self._rich_text(run.repository),
                "Event Type": self._select(run.event_type.value),
                "Repository": self._rich_text(run.repository),
            },
        )

    async def _create_page(self, database_id: str, properties: dict) -> str | None:
        if self.settings.dry_run or not self.settings.notion_token or not database_id:
            return "dry-run-notion-page"

        # Strip None-valued properties so Notion doesn't reject them
        properties = {k: v for k, v in properties.items() if v is not None}

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                f"{self.base_url}/pages",
                json={"parent": {"database_id": database_id}, "properties": properties},
                headers={
                    "Authorization": f"Bearer {self.settings.notion_token}",
                    "Notion-Version": self.settings.notion_version,
                    "Content-Type": "application/json",
                },
            )
            if response.status_code >= 400:
                logger.error(
                    "Notion API error: %s %s — %s",
                    response.status_code,
                    response.reason_phrase,
                    response.text,
                )
                response.raise_for_status()
            return response.json().get("id")

    def _title(self, value: str) -> dict:
        return {"title": [{"text": {"content": value[:200]}}]}

    def _rich_text(self, value: str) -> dict:
        return {"rich_text": [{"text": {"content": value or ""}}]}

    def _status(self, value: str) -> dict:
        notion_status = {
            "pending": "Not started",
            "received": "Not started",
            "analyzed": "In progress",
            "waiting_approval": "In progress",
            "approved": "In progress",
            "open": "Not started",
            "deployed": "Done",
            "failed": "Done",
        }.get(value, "In progress")
        return {"status": {"name": notion_status}}

    def _select(self, value: str) -> dict:
        return {"select": {"name": value}}

    def _date(self, value: str | None) -> dict | None:
        """Format an ISO timestamp as a Notion date property.

        Returns None if no timestamp is available, which causes
        ``_create_page`` to drop the property entirely.
        """
        if not value:
            return None
        return {"date": {"start": value}}

    def _url(self, value: str | None) -> dict | None:
        """Format a URL as a Notion URL property.

        Returns None if no URL is available.
        """
        if not value:
            return None
        return {"url": value}

