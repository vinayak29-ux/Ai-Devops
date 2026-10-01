from datetime import datetime, timezone

from app.domain.models import EventType, GitHubEvent


def parse_github_event(event_type: str, delivery_id: str, payload: dict) -> GitHubEvent:
    repo = payload.get("repository", {})
    repository = repo.get("full_name") or repo.get("name") or "unknown/repository"
    actor = (payload.get("sender") or {}).get("login")
    now_iso = datetime.now(timezone.utc).isoformat()

    if event_type == EventType.PUSH.value:
        head_commit = payload.get("head_commit") or {}
        commits = payload.get("commits") or []
        changed = []
        for commit in commits:
            changed.extend(commit.get("added", []))
            changed.extend(commit.get("modified", []))
            changed.extend(commit.get("removed", []))
        # Prefer head_commit author name over sender login for display
        commit_actor = (head_commit.get("author") or {}).get("username") or actor
        commit_timestamp = head_commit.get("timestamp")
        if not commit_timestamp and commits:
            commit_timestamp = commits[-1].get("timestamp")
        if not commit_timestamp:
            commit_timestamp = now_iso

        return GitHubEvent(
            event_type=EventType.PUSH,
            delivery_id=delivery_id,
            repository=repository,
            branch=(payload.get("ref") or "").removeprefix("refs/heads/"),
            actor=commit_actor,
            commit_sha=payload.get("after"),
            commit_timestamp=commit_timestamp,
            title=head_commit.get("message"),
            url=head_commit.get("url"),
            changed_files=sorted(set(changed)),
            raw=payload,
        )

    if event_type == EventType.PULL_REQUEST.value:
        pr = payload.get("pull_request") or {}
        return GitHubEvent(
            event_type=EventType.PULL_REQUEST,
            delivery_id=delivery_id,
            repository=repository,
            branch=(pr.get("head") or {}).get("ref"),
            actor=actor,
            commit_sha=(pr.get("head") or {}).get("sha"),
            commit_timestamp=pr.get("created_at") or pr.get("updated_at") or now_iso,
            title=pr.get("title"),
            url=pr.get("html_url"),
            changed_files=[],
            raw=payload,
        )

    if event_type == EventType.RELEASE.value:
        release = payload.get("release") or {}
        return GitHubEvent(
            event_type=EventType.RELEASE,
            delivery_id=delivery_id,
            repository=repository,
            actor=actor,
            commit_timestamp=release.get("published_at") or release.get("created_at") or now_iso,
            title=release.get("name") or release.get("tag_name"),
            url=release.get("html_url"),
            raw=payload,
        )

    if event_type == EventType.WORKFLOW_RUN.value:
        workflow = payload.get("workflow_run") or {}
        return GitHubEvent(
            event_type=EventType.WORKFLOW_RUN,
            delivery_id=delivery_id,
            repository=repository,
            branch=workflow.get("head_branch"),
            actor=actor,
            commit_sha=workflow.get("head_sha"),
            commit_timestamp=workflow.get("updated_at") or workflow.get("created_at") or now_iso,
            title=workflow.get("display_title"),
            url=workflow.get("html_url"),
            workflow_name=workflow.get("name"),
            workflow_conclusion=workflow.get("conclusion"),
            raw=payload,
        )

    return GitHubEvent(
        event_type=EventType.UNKNOWN,
        delivery_id=delivery_id,
        repository=repository,
        actor=actor,
        raw=payload,
    )
