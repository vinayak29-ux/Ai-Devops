import hashlib
import hmac

from fastapi import Header, HTTPException, Request, status

from app.core.settings import get_settings


def verify_github_signature(raw_body: bytes, signature: str | None, secret: str) -> None:
    if not secret:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Webhook secret is not configured")
    if not signature or not signature.startswith("sha256="):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing GitHub signature")

    expected = "sha256=" + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid GitHub signature")


async def require_api_token(authorization: str | None = Header(default=None)) -> None:
    settings = get_settings()
    expected = f"Bearer {settings.api_token}"
    if not settings.api_token or not hmac.compare_digest(authorization or "", expected):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid API token")


async def parse_verified_github_payload(
    request: Request,
    x_hub_signature_256: str | None = Header(default=None),
) -> dict:
    settings = get_settings()
    raw_body = await request.body()
    verify_github_signature(raw_body, x_hub_signature_256, settings.webhook_secret)
    return await request.json()
