from datetime import datetime, timezone

from sqlalchemy import DateTime, String, Text, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.domain.models import EventType, RiskLevel, RunRecord, RunStatus


class Base(DeclarativeBase):
    pass


class RunORM(Base):
    __tablename__ = "runs"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    delivery_id: Mapped[str] = mapped_column(String(128), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    repository: Mapped[str] = mapped_column(String(256), index=True)
    status: Mapped[str] = mapped_column(String(64), index=True)
    risk: Mapped[str | None] = mapped_column(String(64), nullable=True)
    summary: Mapped[str] = mapped_column(Text, default="")
    jira_issue_key: Mapped[str | None] = mapped_column(String(64), nullable=True)
    notion_page_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    netlify_deploy_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


engine = None
SessionLocal: async_sessionmaker[AsyncSession] | None = None


async def init_db(database_url: str) -> None:
    global engine, SessionLocal
    engine = create_async_engine(database_url)
    SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


def _to_record(row: RunORM) -> RunRecord:
    return RunRecord(
        id=row.id,
        delivery_id=row.delivery_id,
        event_type=EventType(row.event_type),
        repository=row.repository,
        status=RunStatus(row.status),
        risk=RiskLevel(row.risk) if row.risk else None,
        summary=row.summary,
        jira_issue_key=row.jira_issue_key,
        notion_page_id=row.notion_page_id,
        netlify_deploy_id=row.netlify_deploy_id,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


class RunStore:
    async def save(self, run: RunRecord) -> RunRecord:
        if SessionLocal is None:
            raise RuntimeError("Database is not initialized")
        async with SessionLocal() as session:
            existing = await session.get(RunORM, run.id)
            now = datetime.now(timezone.utc)
            if existing:
                existing.status = run.status.value
                existing.risk = run.risk.value if run.risk else None
                existing.summary = run.summary
                existing.jira_issue_key = run.jira_issue_key
                existing.notion_page_id = run.notion_page_id
                existing.netlify_deploy_id = run.netlify_deploy_id
                existing.updated_at = now
            else:
                session.add(
                    RunORM(
                        id=run.id,
                        delivery_id=run.delivery_id,
                        event_type=run.event_type.value,
                        repository=run.repository,
                        status=run.status.value,
                        risk=run.risk.value if run.risk else None,
                        summary=run.summary,
                        jira_issue_key=run.jira_issue_key,
                        notion_page_id=run.notion_page_id,
                        netlify_deploy_id=run.netlify_deploy_id,
                        created_at=run.created_at,
                        updated_at=now,
                    )
                )
            await session.commit()
            return run

    async def get(self, run_id: str) -> RunRecord | None:
        if SessionLocal is None:
            raise RuntimeError("Database is not initialized")
        async with SessionLocal() as session:
            row = await session.get(RunORM, run_id)
            return _to_record(row) if row else None

    async def latest(self, limit: int = 50) -> list[RunRecord]:
        if SessionLocal is None:
            raise RuntimeError("Database is not initialized")
        async with SessionLocal() as session:
            rows = await session.scalars(
                select(RunORM).order_by(RunORM.created_at.desc()).limit(min(limit, 200))
            )
            return [_to_record(row) for row in rows]
