import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authorization import (
    _compute_permissions_from_db,
    require_permission,
)
from app.core.cache import (
    delete_cache,
    permissions_cache_key,
)
from app.database.models.organization_role_permission import OrganizationRolePermission
from app.database.models.permission import Permission
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.permissions import PermissionOverride, PermissionOverrideResponse
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter(tags=["permissions"])


@router.get(
    "/organizations/{organization_id}/roles/{role_id}/permissions",
    response_model=list[PermissionOverrideResponse],
)
def get_role_permissions(
    organization_id: int,
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("permission.manage")),
):
    defaults = _compute_permissions_from_db(db, role_id, organization_id)

    overrides = (
        db.query(OrganizationRolePermission)
        .filter(
            OrganizationRolePermission.organization_id == organization_id,
            OrganizationRolePermission.role_id == role_id,
        )
        .all()
    )
    override_map = {o.permission_id: o.allowed for o in overrides}

    all_perms = db.query(Permission).all()
    result: list[PermissionOverrideResponse] = []
    for perm in all_perms:
        if perm.id in override_map:
            result.append(
                PermissionOverrideResponse(
                    permission_id=perm.id,
                    permission_name=perm.name,
                    allowed=override_map[perm.id],
                    source="override",
                )
            )
        elif perm.name in defaults:
            result.append(
                PermissionOverrideResponse(
                    permission_id=perm.id,
                    permission_name=perm.name,
                    allowed=True,
                    source="default",
                )
            )

    result.sort(key=lambda r: r.permission_id)
    return result


@router.put(
    "/organizations/{organization_id}/roles/{role_id}/permissions",
    status_code=status.HTTP_200_OK,
)
async def put_role_permissions(
    organization_id: int,
    role_id: int,
    body: list[PermissionOverride],
    db: Session = Depends(get_db),
    caller: User = Depends(require_permission("permission.manage")),
):
    existing = (
        db.query(OrganizationRolePermission)
        .filter(
            OrganizationRolePermission.organization_id == organization_id,
            OrganizationRolePermission.role_id == role_id,
        )
        .all()
    )
    before = {str(o.permission_id): o.allowed for o in existing}

    for row in existing:
        db.delete(row)

    for override in body:
        perm = db.query(Permission).filter(Permission.id == override.permission_id).first()
        if perm is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Permission id={override.permission_id} not found",
            )
        db.add(
            OrganizationRolePermission(
                organization_id=organization_id,
                role_id=role_id,
                permission_id=override.permission_id,
                allowed=override.allowed,
            )
        )

    after = {str(o.permission_id): o.allowed for o in body}
    log_action(db, caller.id, organization_id, "update", "role_permissions", role_id, before, after)
    db.commit()

    try:
        await delete_cache(permissions_cache_key(organization_id, role_id))
    except Exception:
        logger.exception("Failed to invalidate permissions cache")
