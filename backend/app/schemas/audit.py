from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    organization_id: int | None
    actor_id: int
    action: str
    entity_type: str
    entity_id: int | None
    before: dict | None
    after: dict | None
    created_at: datetime

    class Config:
        from_attributes = True
