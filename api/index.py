import hmac
import os

from fastapi import Depends, FastAPI, Header, HTTPException, status

app = FastAPI()


def verify_internal_key(x_internal_key: str | None = Header(default=None)) -> None:
    expected = os.environ.get("INTERNAL_API_KEY")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="INTERNAL_API_KEY not configured",
        )
    if not x_internal_key or not hmac.compare_digest(x_internal_key, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@app.get("/api/py/health", dependencies=[Depends(verify_internal_key)])
def health() -> dict[str, str]:
    return {"status": "ok"}
