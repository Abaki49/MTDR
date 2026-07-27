from datetime import datetime

from pydantic import BaseModel, Field


class MembershipCreate(BaseModel):
    user_id: int
    role_id: int


class MembershipUpdate(BaseModel):
    role_id: int | None = None
    status: str | None = Field(None, pattern=r"^(ACTIVE|SUSPENDED|INVITED)$")


class MembershipResponse(BaseModel):
    id: int
    user_id: int
    organization_id: int
    role_id: int
    status: str
    created_at: datetime
    updated_at: datetime
    user_name: str = ""
    user_email: str = ""

    class Config:
        from_attributes = True
