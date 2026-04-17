from fastapi import Depends, FastAPI

from .controllers.contacts import router as contacts_router
from .core.security import verify_internal_key

app = FastAPI()

app.include_router(contacts_router)


@app.get("/api/py/health", dependencies=[Depends(verify_internal_key)])
def health() -> dict[str, str]:
    return {"status": "ok"}
