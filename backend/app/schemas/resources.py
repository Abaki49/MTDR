from datetime import datetime

from pydantic import BaseModel, Field


class ResourceCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    storage_key: str = Field(..., max_length=512)
    visibility: str = Field(default="PRIVATE", pattern=r"^(PUBLIC|PRIVATE)$")


class ResourceUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    storage_key: str | None = Field(None, max_length=512)
    visibility: str | None = Field(None, pattern=r"^(PUBLIC|PRIVATE)$")


class ResourceResponse(BaseModel):
    id: int
    organization_id: int
    title: str
    description: str | None
    storage_key: str
    visibility: str
    created_by: int | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
