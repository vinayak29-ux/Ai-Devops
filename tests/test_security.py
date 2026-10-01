import hashlib
import hmac

import pytest
from fastapi import HTTPException

from app.core.security import verify_github_signature


def test_verify_github_signature_accepts_valid_signature():
    body = b'{"ok":true}'
    secret = "secret"
    signature = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()

    verify_github_signature(body, signature, secret)


def test_verify_github_signature_rejects_invalid_signature():
    with pytest.raises(HTTPException):
        verify_github_signature(b"{}", "sha256=bad", "secret")
