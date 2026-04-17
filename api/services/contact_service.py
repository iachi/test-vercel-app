import re

import psycopg
from fastapi import HTTPException, status

from ..models.contact import ContactIn, ContactOut
from ..repositories import contact_repository

_PHONE_RE = re.compile(r"^\+?\d{7,15}$")
_PHONE_STRIP_RE = re.compile(r"[\s\-()]")


def _normalize_phone(raw: str) -> str:
    return _PHONE_STRIP_RE.sub("", raw)


def create_contact(conn: psycopg.Connection, data: ContactIn) -> ContactOut:
    name = data.name.strip()
    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Name is required.",
        )

    phone = _normalize_phone(data.phone)
    if not _PHONE_RE.match(phone):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Phone must be 7-15 digits, optional leading +.",
        )

    return contact_repository.insert_contact(conn, ContactIn(name=name, phone=phone))
