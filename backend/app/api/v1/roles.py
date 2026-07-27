from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.authorization import require_permission
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.roles import RoleResponse
from app.services.role_service import list_roles

router = APIRouter(tags=["roles"])


@router.get(
    "/organizations/{organization_id}/roles",
    response_model=list[RoleResponse],
)
def get_roles(
    organization_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.read")),
):
    return [RoleResponse.model_validate(r) for r in list_roles(db)]
