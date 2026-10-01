import base64

import httpx

from app.core.settings import Settings
from app.domain.models import AiAssessment, GitHubEvent


class JiraClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    async def create_issue(self, event: GitHubEvent, assessment: AiAssessment) -> str | None:
        if self.settings.dry_run or not all(
            [self.settings.jira_base_url, self.settings.jira_email, self.settings.jira_api_token]
        ):
            return "DRY-RUN-JIRA"

        token = base64.b64encode(
            f"{self.settings.jira_email}:{self.settings.jira_api_token}".encode()
        ).decode()
        url = f"{str(self.settings.jira_base_url).rstrip('/')}/rest/api/3/issue"
        payload = {
            "fields": {
                "project": {"key": self.settings.jira_project_key},
                "summary": assessment.jira_title,
                "issuetype": {"name": self.settings.jira_issue_type},
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [{"type": "text", "text": assessment.jira_description}],
                        }
                    ],
                },
                "labels": ["shipwise-ai", assessment.risk.value, event.event_type.value],
            }
        }
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Authorization": f"Basic {token}", "Accept": "application/json"},
            )
            response.raise_for_status()
            return response.json()["key"]
