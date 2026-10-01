from datetime import datetime, timezone
import hashlib
import hmac
import json
import os
import sys
from urllib import request


def main() -> None:
    url = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000/webhooks/github"
    secret = os.getenv("SHIPWISE_WEBHOOK_SECRET", "replace-with-github-webhook-secret")
    event_type = sys.argv[2] if len(sys.argv) > 2 else "push"
    now_iso = datetime.now(timezone.utc).isoformat()

    payload = {
        "ref": "refs/heads/main",
        "after": "abc123",
        "repository": {"full_name": "demo/shipwise-target"},
        "sender": {"login": "local-tester"},
        "head_commit": {
            "message": "Add database migration",
            "url": "https://github.com/demo/shipwise-target/commit/abc123",
            "timestamp": now_iso,
            "author": {"username": "local-tester"},
        },
        "commits": [
            {
                "added": ["migrations/001_create_users.sql"],
                "modified": ["app/auth.py"],
                "removed": [],
                "timestamp": now_iso,
            }
        ],
    }

    body = json.dumps(payload).encode()
    signature = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    req = request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-GitHub-Event": event_type,
            "X-GitHub-Delivery": "local-demo-001",
            "X-Hub-Signature-256": signature,
        },
    )

    with request.urlopen(req) as response:
        print(response.status)
        print(response.read().decode())


if __name__ == "__main__":
    main()
