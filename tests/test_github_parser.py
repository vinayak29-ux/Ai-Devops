from app.domain.models import EventType
from app.services.github_parser import parse_github_event


def test_parse_push_event_collects_changed_files():
    payload = {
        "ref": "refs/heads/main",
        "after": "abc123",
        "repository": {"full_name": "acme/api"},
        "sender": {"login": "dev"},
        "head_commit": {"message": "ship it", "url": "https://github.test/commit"},
        "commits": [{"added": ["a.py"], "modified": ["b.py"], "removed": ["old.py"]}],
    }

    event = parse_github_event("push", "delivery-1", payload)

    assert event.event_type == EventType.PUSH
    assert event.repository == "acme/api"
    assert event.branch == "main"
    assert event.changed_files == ["a.py", "b.py", "old.py"]


def test_parse_failed_workflow_event():
    payload = {
        "repository": {"full_name": "acme/web"},
        "workflow_run": {
            "name": "CI",
            "conclusion": "failure",
            "head_branch": "main",
            "head_sha": "def456",
            "display_title": "CI failed",
            "html_url": "https://github.test/actions",
        },
    }

    event = parse_github_event("workflow_run", "delivery-2", payload)

    assert event.event_type == EventType.WORKFLOW_RUN
    assert event.workflow_conclusion == "failure"
