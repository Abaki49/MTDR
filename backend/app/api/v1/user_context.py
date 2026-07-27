from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.authorization import resolve_permissions
from app.database.models.membership import Membership
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.auth import UserPermissionsResponse

router = APIRouter(tags=["user-context"])


@router.get(
    "/organizations/{organization_id}/me/permissions",
    response_model=UserPermissionsResponse,
)
async def get_my_permissions(
    organization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_super_admin:
        return UserPermissionsResponse(permissions=["*"])

    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == current_user.id,
            Membership.organization_id == organization_id,
            Membership.status == "ACTIVE",
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    perms = await resolve_permissions(db, membership.role_id, organization_id)
    return UserPermissionsResponse(permissions=sorted(perms))
