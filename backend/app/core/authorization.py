from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.database.models.membership import Membership
from app.database.models.organization_role_permission import OrganizationRolePermission
from app.database.models.permission import Permission
from app.database.models.role_permission import RolePermission
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


def _resolve_permissions(db: Session, role_id: int, organization_id: int) -> set[str]:
    role_perm_ids = [
        rp.permission_id
        for rp in db.query(RolePermission).filter(RolePermission.role_id == role_id).all()
    ]

    permission_names = set()
    if role_perm_ids:
        rows = db.query(Permission).filter(Permission.id.in_(role_perm_ids)).all()
        permission_names = {p.name for p in rows}

    overrides = (
        db.query(OrganizationRolePermission)
        .filter(
            OrganizationRolePermission.role_id == role_id,
            OrganizationRolePermission.organization_id == organization_id,
        )
        .all()
    )
    for override in overrides:
        perm = db.query(Permission).filter(Permission.id == override.permission_id).first()
        if perm is None:
            continue
        if override.allowed:
            permission_names.add(perm.name)
        else:
            permission_names.discard(perm.name)

    return permission_names


def authorize(
    db: Session,
    user: User,
    organization_id: int,
    permission: str,
) -> None:
    if user.is_super_admin:
        return

    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == user.id,
            Membership.organization_id == organization_id,
            Membership.status == "ACTIVE",
        )
        .first()
    )
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    effective_permissions = _resolve_permissions(db, membership.role_id, organization_id)
    if permission not in effective_permissions:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")


def require_permission(permission: str):
    def dependency(
        organization_id: int = Path(alias="organization_id"),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> User:
        authorize(db, current_user, organization_id, permission)
        return current_user

    return dependency
