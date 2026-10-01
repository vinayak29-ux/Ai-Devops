from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.security import parse_verified_github_payload, require_api_token
from app.core.settings import get_settings
from app.domain.models import RunRecord
from app.services.github_parser import parse_github_event
from app.services.orchestrator import DeploymentOrchestrator
from app.services.run_store import RunStore

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    return {"status": "ok", "service": "shipwise-ai"}


@router.post("/webhooks/github", status_code=status.HTTP_202_ACCEPTED)
async def github_webhook(
    payload: dict = Depends(parse_verified_github_payload),
    x_github_event: str = Header(default="unknown"),
    x_github_delivery: str = Header(default="manual"),
) -> RunRecord:
    event = parse_github_event(x_github_event, x_github_delivery, payload)
    orchestrator = DeploymentOrchestrator(get_settings())
    return await orchestrator.handle_event(event)


@router.get("/runs", dependencies=[Depends(require_api_token)])
async def list_runs(limit: int = 50) -> list[RunRecord]:
    return await RunStore().latest(limit)


@router.get("/runs/{run_id}", dependencies=[Depends(require_api_token)])
async def get_run(run_id: str) -> RunRecord:
    run = await RunStore().get(run_id)
    if not run:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Run not found")
    return run


@router.post("/deployments/{run_id}/approve", dependencies=[Depends(require_api_token)])
async def approve_deployment(run_id: str) -> RunRecord:
    try:
        return await DeploymentOrchestrator(get_settings()).approve_and_deploy(run_id)
    except LookupError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
