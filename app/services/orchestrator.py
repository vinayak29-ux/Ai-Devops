import logging

from app.core.settings import Settings
from app.domain.models import GitHubEvent, RiskLevel, RunRecord, RunStatus
from app.integrations.gemini import GeminiClient
from app.integrations.jira import JiraClient
from app.integrations.netlify import NetlifyClient
from app.integrations.notion import NotionClient
from app.services.run_store import RunStore

logger = logging.getLogger(__name__)


class DeploymentOrchestrator:
    def __init__(self, settings: Settings, store: RunStore | None = None):
        self.settings = settings
        self.store = store or RunStore()
        self.ai = GeminiClient(settings)
        self.jira = JiraClient(settings)
        self.netlify = NetlifyClient(settings)
        self.notion = NotionClient(settings)

    async def handle_event(self, event: GitHubEvent) -> RunRecord:
        run = RunRecord(
            delivery_id=event.delivery_id,
            event_type=event.event_type,
            repository=event.repository,
        )
        await self.store.save(run)
        logger.info("Received GitHub event", extra={"run_id": run.id, "event_type": event.event_type})

        try:
            assessment = await self.ai.assess_change(event)
            run.risk = assessment.risk
            run.summary = assessment.summary
            run.status = RunStatus.ANALYZED

            if event.workflow_conclusion and event.workflow_conclusion != "success":
                run.jira_issue_key = await self.jira.create_issue(event, assessment)
                await self.notion.record_incident(event, assessment)

            if assessment.risk == RiskLevel.LOW:
                run.netlify_deploy_id = await self.netlify.trigger_deploy(
                    assessment.release_notes or assessment.summary,
                    event.commit_sha,
                )
                run.status = RunStatus.DEPLOYED
            else:
                run.jira_issue_key = run.jira_issue_key or await self.jira.create_issue(event, assessment)
                run.notion_page_id = await self.notion.queue_approval(run, event, assessment)
                run.status = RunStatus.WAITING_APPROVAL

            await self.notion.record_deployment(run, event, assessment)
            try:
                await self.notion.record_run_log(run, run.summary)
            except Exception:
                logger.warning("Failed to write Notion run log; continuing", extra={"run_id": run.id})
            await self.store.save(run)
            return run
        except Exception as exc:
            logger.exception("Deployment orchestration failed", extra={"run_id": run.id})
            run.status = RunStatus.FAILED
            run.summary = str(exc)
            await self.store.save(run)
            raise

    async def approve_and_deploy(self, run_id: str) -> RunRecord:
        run = await self.store.get(run_id)
        if not run:
            raise LookupError("Run not found")
        if run.status != RunStatus.WAITING_APPROVAL:
            return run

        run.status = RunStatus.APPROVED
        await self.store.save(run)
        run.netlify_deploy_id = await self.netlify.trigger_deploy(f"Approved ShipWise run {run.id}")
        run.status = RunStatus.DEPLOYED
        await self.store.save(run)
        await self.notion.record_run_log(run, "Human approval received; deployment triggered.")
        return run
