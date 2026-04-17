import psycopg
from fastapi import APIRouter, Depends, status

from ..core.db import get_connection
from ..core.security import verify_internal_key
from ..models.contact import ContactIn, ContactOut
from ..services import contact_service

router = APIRouter(
    prefix="/api/py",
    dependencies=[Depends(verify_internal_key)],
)


@router.post(
    "/contacts",
    response_model=ContactOut,
    status_code=status.HTTP_201_CREATED,
)
def create_contact(
    data: ContactIn,
    conn: psycopg.Connection = Depends(get_connection),
) -> ContactOut:
    return contact_service.create_contact(conn, data)
