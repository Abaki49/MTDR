from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.models.membership import Membership
from app.database.models.role import Role
from app.database.models.user import User
from app.database.session import get_db


def require_super_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_super_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only super admins can perform this action",
        )
    return current_user


def verify_org_access(
    organization_id: int = Path(alias="organization_id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> User:
    if current_user.is_super_admin:
        return current_user
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
    return current_user


def verify_org_admin(
    organization_id: int = Path(alias="organization_id"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> tuple[User, int]:
    if current_user.is_super_admin:
        return current_user, 0
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
    role = db.query(Role).filter(Role.id == membership.role_id).first()
    if role is None or role.rank != 1:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return current_user, role.rank
