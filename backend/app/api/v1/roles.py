from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.authorization import require_permission
from app.database.models.membership import Membership
from app.database.models.role import Role
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.roles import RoleResponse
from app.services.role_service import list_roles

router = APIRouter(tags=["roles"])


def _caller_rank(db: Session, caller: User, org_id: int) -> int:
    if caller.is_super_admin:
        return 0
    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == caller.id,
            Membership.organization_id == org_id,
            Membership.status == "ACTIVE",
        )
        .first()
    )
    if not membership:
        return -1
    role = db.query(Role).filter(Role.id == membership.role_id).first()
    return role.rank if role else -1


@router.get(
    "/organizations/{organization_id}/roles",
    response_model=list[RoleResponse],
)
def get_roles(
    organization_id: int,
    db: Session = Depends(get_db),
    caller: User = Depends(require_permission("resource.read")),
):
    caller_rank = _caller_rank(db, caller, organization_id)
    result = []
    for r in list_roles(db):
        resp = RoleResponse.model_validate(r)
        resp.caller_can_assign = caller_rank >= 0 and caller_rank < r.rank
        result.append(resp)
    return result
