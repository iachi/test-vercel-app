import hmac

from fastapi import Header, HTTPException, status

from .config import settings


def verify_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    expected = settings.internal_api_key
    if not x_internal_key or not hmac.compare_digest(x_internal_key, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
