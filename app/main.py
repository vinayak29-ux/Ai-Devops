from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.core.logging import configure_logging
from app.core.settings import get_settings
from app.services.run_store import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    await init_db(get_settings().database_url)
    yield


app = FastAPI(
    title="ShipWise AI",
    description="AI-powered DevOps automation platform.",
    version="0.1.0",
    lifespan=lifespan,
)
app.include_router(router)
