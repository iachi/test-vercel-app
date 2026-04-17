from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ContactIn(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=32)


class ContactOut(BaseModel):
    id: UUID
    name: str
    phone: str
    created_at: datetime
