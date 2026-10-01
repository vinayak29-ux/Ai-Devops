import pytest

from app.core.settings import Settings
from app.domain.models import AiAssessment, EventType, GitHubEvent, RiskLevel, RunRecord, RunStatus
from app.integrations.notion import NotionClient


def _settings() -> Settings:
    return Settings(
        api_token="token",
        webhook_secret="secret",
        dry_run=True,
        database_url="sqlite+aiosqlite:///./test.db",
    )


def _event() -> GitHubEvent:
    return GitHubEvent(
        event_type=EventType.PUSH,
        delivery_id="d-test",
        repository="acme/api",
        branch="main",
        actor="vinayak-dev",
        commit_sha="a1b2c3d4e5f6789",
        commit_timestamp="2026-08-20T14:00:00+05:30",
        title="fix: update auth flow",
        url="https://github.com/acme/api/commit/a1b2c3d",
        changed_files=["src/auth.py", "migrations/001.sql"],
        raw={},
    )


def _assessment() -> AiAssessment:
    return AiAssessment(
        category="release",
        risk=RiskLevel.HIGH,
        summary="Auth flow update with database migration.",
        jira_title="[HIGH] fix: update auth flow",
    )


def _run() -> RunRecord:
    return RunRecord(
        id="run-123",
        delivery_id="d-test",
        event_type=EventType.PUSH,
        repository="acme/api",
        status=RunStatus.ANALYZED,
        risk=RiskLevel.HIGH,
    )


class TestNotionDeploymentProperties:
    """Verify that record_deployment builds pages with developer-friendly fields."""

    @pytest.mark.asyncio
    async def test_record_deployment_includes_developer_fields(self):
        client = NotionClient(_settings())
        # dry_run returns immediately; we patch _create_page to capture properties
        captured = {}

        async def capture_page(database_id, properties):
            captured.update(properties)
            return "test-page-id"

        client._create_page = capture_page

        result = await client.record_deployment(_run(), _event(), _assessment())
        assert result == "test-page-id"

        # Core fields still present
        assert "Name" in captured
        assert "Status" in captured
        assert "Risk" in captured
        assert "Repository" in captured
        assert "Summary" in captured

        # New developer-friendly fields
        assert captured["Developer"]["rich_text"][0]["text"]["content"] == "vinayak-dev"
        assert captured["Branch"]["rich_text"][0]["text"]["content"] == "main"
        assert captured["Commit SHA"]["rich_text"][0]["text"]["content"] == "a1b2c3d"
        assert captured["Commit Message"]["rich_text"][0]["text"]["content"] == "fix: update auth flow"
        assert captured["Commit Time"]["date"]["start"] == "2026-08-20T14:00:00+05:30"
        assert "src/auth.py" in captured["Changed Files"]["rich_text"][0]["text"]["content"]
        assert captured["Commit URL"]["url"] == "https://github.com/acme/api/commit/a1b2c3d"

    @pytest.mark.asyncio
    async def test_queue_approval_includes_developer_fields(self):
        client = NotionClient(_settings())
        captured = {}

        async def capture_page(database_id, properties):
            captured.update(properties)
            return "test-page-id"

        client._create_page = capture_page

        await client.queue_approval(_run(), _event(), _assessment())

        assert captured["Developer"]["rich_text"][0]["text"]["content"] == "vinayak-dev"
        assert captured["Branch"]["rich_text"][0]["text"]["content"] == "main"
        assert captured["Commit SHA"]["rich_text"][0]["text"]["content"] == "a1b2c3d"
        assert captured["Commit Time"]["date"]["start"] == "2026-08-20T14:00:00+05:30"

    @pytest.mark.asyncio
    async def test_record_incident_includes_developer_fields(self):
        client = NotionClient(_settings())
        captured = {}

        async def capture_page(database_id, properties):
            captured.update(properties)
            return "test-page-id"

        client._create_page = capture_page

        await client.record_incident(_event(), _assessment())

        assert captured["Developer"]["rich_text"][0]["text"]["content"] == "vinayak-dev"
        assert captured["Branch"]["rich_text"][0]["text"]["content"] == "main"
        assert captured["Commit Time"]["date"]["start"] == "2026-08-20T14:00:00+05:30"

    @pytest.mark.asyncio
    async def test_date_returns_none_when_no_timestamp(self):
        client = NotionClient(_settings())
        assert client._date(None) is None
        assert client._date("") is None

    @pytest.mark.asyncio
    async def test_url_returns_none_when_no_url(self):
        client = NotionClient(_settings())
        assert client._url(None) is None
        assert client._url("") is None
