# ShipWise AI

ShipWise AI is a production-ready FastAPI service for AI-assisted DevOps automation.
It receives GitHub webhook events, asks Google Gemini to classify changes and deployment risk,
creates Jira work items, writes Notion dashboards, and triggers Netlify deploys for low-risk releases.

## What It Automates

- GitHub webhook monitoring for commits, pull requests, releases, and workflow failures
- AI classification of code changes, release notes, incident summaries, and deployment risk
- Jira issue creation for incidents, risky changes, and workflow failures
- Netlify deploy triggering for low-risk changes
- Notion dashboard updates for deployments, approval queue, incidents, and run logs
- Human approval routing before high-risk deployments

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

The API will be available at `http://localhost:8000`.

If PowerShell says `docker` is not recognized, Docker Desktop is not installed or is not on your
PATH. You can either install Docker Desktop and reopen PowerShell, or run the service directly:

```powershell
copy .env.example .env
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

## GitHub Webhook

Configure a GitHub webhook with:

- Payload URL: `https://your-host/webhooks/github`
- Content type: `application/json`
- Secret: same value as `SHIPWISE_WEBHOOK_SECRET`
- Events: `push`, `pull_request`, `release`, `workflow_run`

GitHub requests are validated with `X-Hub-Signature-256`.

## Test Without GitHub

With the API running locally, send a signed sample webhook:

```powershell
$env:SHIPWISE_WEBHOOK_SECRET="replace-with-github-webhook-secret"
python scripts/send_sample_webhook.py
```

Then inspect runs:

```powershell
Invoke-RestMethod `
  -Uri http://127.0.0.1:8000/runs `
  -Headers @{ Authorization = "Bearer change-me" }
```

The sample includes a database migration, so ShipWise should classify it as high risk and place it
in the approval flow.

## Auth

Operations endpoints require:

```http
Authorization: Bearer <SHIPWISE_API_TOKEN>
```

## Deployment Approval Flow

Low-risk events trigger Netlify deployment automatically. Medium and high-risk events create Notion
approval records and are held until an operator calls:

```http
POST /deployments/{run_id}/approve
Authorization: Bearer <SHIPWISE_API_TOKEN>
```

## Local Development

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
pip install pytest pytest-asyncio ruff
uvicorn app.main:app --reload
pytest
```
