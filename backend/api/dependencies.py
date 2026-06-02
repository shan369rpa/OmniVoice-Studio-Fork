"""
Shared FastAPI dependencies.

These are intentionally tiny — one concern per dependency — so they can be
composed at the route or router level without surprises.

Currently exposed:
- `require_loopback`: 403 unless the request came from a loopback origin.
"""

import os

from fastapi import HTTPException, Request


# IPv4 + IPv6 loopback literals + the conventional `localhost` hostname.
_LOOPBACK_HOSTS = frozenset({"127.0.0.1", "::1", "localhost"})

# LAN mode: skip loopback check to allow LAN clients
_lan_mode = os.environ.get("OMNIVOICE_LAN_MODE", "0").strip() == "1"


def require_loopback(request: Request) -> None:
    """Reject any request whose `client.host` is not a loopback address.

    Use as a router-level dependency to protect every route on the router
    in one place:

        router = APIRouter(dependencies=[Depends(require_loopback)])

    Or as a per-route dependency for narrower scope:

        @router.post("/foo", dependencies=[Depends(require_loopback)])

    Returns None on success (FastAPI dependency convention). Raises 403
    on rejection — the response body is `{"detail": "loopback origin required"}`
    so existing tests for `/system/set-env` keep passing without modification.

    When OMNIVOICE_LAN_MODE=1, loopback check is bypassed to allow LAN clients.
    """
    if _lan_mode:
        return
    host = request.client.host if request.client else None
    if host not in _LOOPBACK_HOSTS:
        raise HTTPException(status_code=403, detail="loopback origin required")

