"""Upload guards: path traversal, file type, size cap, unreadable input.

Run against a live server:
    PYTHONPATH=. python backend/tests/test_upload_guards.py [base_url]

Before these guards the handler put the client's filename straight into a path
(`{uuid}_{filename}`, so `../../x` escaped the storage directory) and read the
whole body into memory with no cap, which a 4 GB VPS cannot survive.
"""

import json
import os
import sys
import urllib.error
import urllib.request
import uuid

BASE = (sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000").rstrip("/")
STORAGE = os.path.join(os.path.dirname(__file__), "..", "data", "uploads")

DEMO = {"nim": "2200000001", "password": "demo1234"}


def login() -> str:
    req = urllib.request.Request(
        f"{BASE}/api/auth/login", method="POST",
        data=json.dumps(DEMO).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["access_token"]


def upload(token: str, filename: str, content: bytes):
    """Post one multipart file. Returns (status, detail)."""
    boundary = f"----test{uuid.uuid4().hex}"
    body = b"".join([
        f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n".encode(),
        content,
        f"\r\n--{boundary}--\r\n".encode(),
    ])
    req = urllib.request.Request(
        f"{BASE}/api/knowledge/upload", method="POST", data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, json.loads(r.read() or "null")
    except urllib.error.HTTPError as e:
        detail = ""
        try:
            detail = json.loads(e.read()).get("detail", "")
        except Exception:
            pass
        return e.code, detail


def test_rejects_disallowed_extension():
    status, detail = upload(login(), "payload.exe", b"MZ\x90\x00")
    assert status == 400, f"expected 400, got {status}"
    assert "Unsupported file type" in str(detail), detail


def test_rejects_empty_document():
    status, detail = upload(login(), "empty.txt", b"   \n  ")
    assert status == 400, f"expected 400, got {status}"
    assert "No text could be extracted" in str(detail), detail


def test_rejects_oversize_upload():
    status, detail = upload(login(), "big.txt", b"A" * (21 * 1024 * 1024))
    assert status == 413, f"expected 413, got {status}"
    assert "limit" in str(detail), detail


def test_traversal_filename_cannot_escape_storage():
    before = set(os.listdir(STORAGE)) if os.path.isdir(STORAGE) else set()
    escaped = os.path.abspath(os.path.join(STORAGE, "..", "..", "..", "pwned.txt"))

    # A .txt extension is allowed, so this reaches the storage step. Only the
    # extension may survive; the stored name must be the document's own uuid.
    upload(login(), "../../../pwned.txt", b"harmless text content for parsing")

    assert not os.path.exists(escaped), f"LEAK: file written outside storage at {escaped}"

    after = set(os.listdir(STORAGE)) if os.path.isdir(STORAGE) else set()
    for name in after - before:
        assert ".." not in name and "/" not in name and "\\" not in name, f"unsafe name: {name}"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print(f"ok  {name}")
    print("\nall upload guard checks passed")
