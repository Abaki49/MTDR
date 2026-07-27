from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.authorization import require_permission, require_super_admin
from app.database.models.audit_log import AuditLog
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.audit import AuditLogResponse

router = APIRouter(tags=["audit"])


@router.get(
    "/organizations/{organization_id}/audit-logs",
    response_model=list[AuditLogResponse],
)
def get_org_audit_logs(
    organization_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("audit.read")),
):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.organization_id == organization_id)
        .order_by(AuditLog.created_at.desc())
        .all()
    )
    return [AuditLogResponse.model_validate(log) for log in logs]


@router.get(
    "/audit-logs",
    response_model=list[AuditLogResponse],
)
def get_all_audit_logs(
    organization_id: int | None = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    query = db.query(AuditLog)
    if organization_id is not None:
        query = query.filter(AuditLog.organization_id == organization_id)
    logs = query.order_by(AuditLog.created_at.desc()).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
