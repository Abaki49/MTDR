from sqlalchemy.orm import Session

from app.database.models.audit_log import AuditLog


def log_action(
    db: Session,
    actor_id: int,
    organization_id: int | None,
    action: str,
    entity_type: str,
    entity_id: int | None,
    before: dict | None,
    after: dict | None,
) -> AuditLog:
    entry = AuditLog(
        actor_id=actor_id,
        organization_id=organization_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after,
    )
    db.add(entry)
    return entry
