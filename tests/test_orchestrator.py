import pytest

from app.core.settings import Settings
from app.domain.models import EventType, GitHubEvent, RunStatus
from app.services.orchestrator import DeploymentOrchestrator
from app.services.run_store import RunStore, init_db


@pytest.fixture(autouse=True)
async def db(tmp_path):
    await init_db(f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")


def settings() -> Settings:
    return Settings(
        api_token="token",
        webhook_secret="secret",
        dry_run=True,
        database_url="sqlite+aiosqlite:///./test.db",
    )


@pytest.mark.asyncio
async def test_low_risk_event_deploys():
    event = GitHubEvent(
        event_type=EventType.PUSH,
        delivery_id="d1",
        repository="acme/api",
        branch="main",
        title="docs update",
        changed_files=["README.md"],
        raw={},
    )

    run = await DeploymentOrchestrator(settings(), RunStore()).handle_event(event)

    assert run.status == RunStatus.DEPLOYED
    assert run.netlify_deploy_id == "dry-run-netlify-deploy"


@pytest.mark.asyncio
async def test_high_risk_event_waits_for_approval():
    event = GitHubEvent(
        event_type=EventType.PUSH,
        delivery_id="d2",
        repository="acme/api",
        branch="main",
        title="database migration",
        changed_files=["migrations/001.sql"],
        raw={},
    )

    run = await DeploymentOrchestrator(settings(), RunStore()).handle_event(event)

    assert run.status == RunStatus.WAITING_APPROVAL
    assert run.jira_issue_key == "DRY-RUN-JIRA"
