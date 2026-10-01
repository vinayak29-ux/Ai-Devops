import json
import logging

import httpx

from app.core.settings import Settings
from app.domain.models import AiAssessment, GitHubEvent, RiskLevel

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = "https://generativelanguage.googleapis.com/v1beta"

    async def assess_change(self, event: GitHubEvent) -> AiAssessment:
        if self.settings.dry_run or not self.settings.gemini_api_key:
            return self._heuristic_assessment(event)

        prompt = self._build_prompt(event)
        url = f"{self.base_url}/models/{self.settings.gemini_model}:generateContent"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    url, params={"key": self.settings.gemini_api_key}, json=payload
                )
                response.raise_for_status()
            text = response.json()["candidates"][0]["content"]["parts"][0]["text"]
            return self._parse_response(text, event)
        except Exception:
            logger.exception("Gemini API call failed; using heuristic assessment", extra={"event_type": event.event_type})
            return self._heuristic_assessment(event)

    def _build_prompt(self, event: GitHubEvent) -> str:
        return f"""
You are ShipWise AI, a senior DevOps release analyst.
Return strict JSON with keys: category, risk, summary, release_notes, incident_summary,
recommended_actions, jira_title, jira_description. Risk must be low, medium, or high.

GitHub event:
{event.model_dump_json(indent=2)}
"""

    def _parse_response(self, text: str, event: GitHubEvent) -> AiAssessment:
        try:
            start = text.find("{")
            end = text.rfind("}") + 1
            data = json.loads(text[start:end])
            return AiAssessment(**data)
        except Exception:
            logger.exception("Failed to parse Gemini response", extra={"event_type": event.event_type})
            fallback = self._heuristic_assessment(event)
            fallback.summary = text[:1000] or fallback.summary
            return fallback

    def _heuristic_assessment(self, event: GitHubEvent) -> AiAssessment:
        changed = " ".join(event.changed_files).lower()
        failure = event.workflow_conclusion and event.workflow_conclusion != "success"
        risky_terms = ("migration", "infra", "terraform", "auth", "payment", "security", "database")
        risk = RiskLevel.HIGH if failure or any(term in changed for term in risky_terms) else RiskLevel.LOW
        category = "incident" if failure else "release"
        title = event.title or f"{event.event_type.value} in {event.repository}"
        return AiAssessment(
            category=category,
            risk=risk,
            summary=f"{title} assessed as {risk.value} risk.",
            release_notes=f"Changes from {event.repository} on {event.branch or 'unknown branch'}.",
            incident_summary=(
                f"Workflow {event.workflow_name} ended with {event.workflow_conclusion}."
                if failure
                else ""
            ),
            recommended_actions=["Review CI output", "Validate rollback plan"] if risk != RiskLevel.LOW else [],
            jira_title=f"[{risk.value.upper()}] {title}",
            jira_description=f"Repository: {event.repository}\nEvent: {event.event_type.value}\nURL: {event.url}",
        )
