import httpx

from app.core.settings import Settings


class NetlifyClient:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.base_url = "https://api.netlify.com/api/v1"

    async def trigger_deploy(self, title: str, commit_sha: str | None = None) -> str | None:
        if self.settings.dry_run or not all([self.settings.netlify_token, self.settings.netlify_site_id]):
            return "dry-run-netlify-deploy"

        payload = {"title": title}
        if commit_sha:
            payload["commit_ref"] = commit_sha

        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(
                f"{self.base_url}/sites/{self.settings.netlify_site_id}/deploys",
                json=payload,
                headers={"Authorization": f"Bearer {self.settings.netlify_token}"},
            )
            response.raise_for_status()
            return response.json().get("id")
