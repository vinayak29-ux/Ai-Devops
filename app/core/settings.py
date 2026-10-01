from functools import lru_cache

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="SHIPWISE_", env_file=".env", extra="ignore")

    env: str = "development"
    api_token: str = "change-me"
    webhook_secret: str = "replace-me"
    dry_run: bool = True
    database_url: str = "sqlite+aiosqlite:///./shipwise.db"

    gemini_api_key: str = Field(default="", validation_alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-1.5-pro", validation_alias="GEMINI_MODEL")

    jira_base_url: HttpUrl | None = Field(default=None, validation_alias="JIRA_BASE_URL")
    jira_email: str = Field(default="", validation_alias="JIRA_EMAIL")
    jira_api_token: str = Field(default="", validation_alias="JIRA_API_TOKEN")
    jira_project_key: str = Field(default="OPS", validation_alias="JIRA_PROJECT_KEY")
    jira_issue_type: str = Field(default="Task", validation_alias="JIRA_ISSUE_TYPE")

    netlify_token: str = Field(default="", validation_alias="NETLIFY_TOKEN")
    netlify_site_id: str = Field(default="", validation_alias="NETLIFY_SITE_ID")

    notion_token: str = Field(default="", validation_alias="NOTION_TOKEN")
    notion_version: str = Field(default="2022-06-28", validation_alias="NOTION_VERSION")
    notion_deployments_database_id: str = Field(
        default="", validation_alias="NOTION_DEPLOYMENTS_DATABASE_ID"
    )
    notion_approvals_database_id: str = Field(
        default="", validation_alias="NOTION_APPROVALS_DATABASE_ID"
    )
    notion_incidents_database_id: str = Field(
        default="", validation_alias="NOTION_INCIDENTS_DATABASE_ID"
    )
    notion_run_logs_database_id: str = Field(default="", validation_alias="NOTION_RUN_LOGS_DATABASE_ID")


@lru_cache
def get_settings() -> Settings:
    return Settings()
