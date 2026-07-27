from datetime import datetime

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class MembershipInfo(BaseModel):
    organization_id: int
    organization_name: str
    role_name: str
    status: str

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    is_super_admin: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    memberships: list[MembershipInfo] = []

    class Config:
        from_attributes = True
