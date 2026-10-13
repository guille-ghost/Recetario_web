import hmac

from fastapi import Header, HTTPException, status

from .settings import get_settings


def require_upload_secret(x_upload_secret: str | None = Header(default=None)) -> None:
    expected = get_settings().upload_secret
    if not expected:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Upload secret is not configured")
    if not x_upload_secret or not hmac.compare_digest(x_upload_secret, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid upload secret")
