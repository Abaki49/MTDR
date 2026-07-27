from pydantic import BaseModel


class PermissionOverride(BaseModel):
    permission_id: int
    allowed: bool


class PermissionOverrideResponse(BaseModel):
    permission_id: int
    permission_name: str
    allowed: bool
    source: str  # "default" or "override"
