from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, Field


class OrganizationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=255)
    description: str | None = None


class OrganizationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    slug: str | None = Field(None, max_length=255)
    description: str | None = None


class OrganizationResponse(BaseModel):
    id: int
    name: str
    slug: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    next_cursor: str | None
