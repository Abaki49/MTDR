from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.authorization import require_permission
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.resources import ResourceCreate, ResourceResponse, ResourceUpdate
from app.services.resource_service import (
    create_resource,
    delete_resource,
    get_org_resource,
    list_org_resources,
    update_resource,
)

router = APIRouter(tags=["resources"])


@router.get(
    "/organizations/{organization_id}/resources",
    response_model=list[ResourceResponse],
)
def get_resources(
    organization_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.read")),
):
    return [
        ResourceResponse.model_validate(r)
        for r in list_org_resources(db, organization_id)
    ]


@router.post(
    "/organizations/{organization_id}/resources",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
)
def post_resource(
    organization_id: int,
    body: ResourceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("resource.create")),
):
    resource = create_resource(db, organization_id, body, current_user.id)
    return ResourceResponse.model_validate(resource)


@router.get(
    "/organizations/{organization_id}/resources/{resource_id}",
    response_model=ResourceResponse,
)
def get_resource_by_id(
    organization_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.read")),
):
    resource = get_org_resource(db, organization_id, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return ResourceResponse.model_validate(resource)


@router.put(
    "/organizations/{organization_id}/resources/{resource_id}",
    response_model=ResourceResponse,
)
def put_resource(
    organization_id: int,
    resource_id: int,
    body: ResourceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.update")),
):
    resource = get_org_resource(db, organization_id, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    resource = update_resource(db, resource, body)
    return ResourceResponse.model_validate(resource)


@router.delete(
    "/organizations/{organization_id}/resources/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_resource_by_id(
    organization_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.delete")),
):
    resource = get_org_resource(db, organization_id, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    delete_resource(db, resource)
