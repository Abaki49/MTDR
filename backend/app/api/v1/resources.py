import json

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.authorization import authorize, require_permission
from app.database.models.resource import Resource
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


@router.get("/resources/{resource_id}/download")
async def download_resource(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resource = db.query(Resource).filter(Resource.id == resource_id).first()
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    await authorize(db, current_user, resource.organization_id, "resource.read")
    payload = json.dumps({"id": resource.id, "title": resource.title, "storage_key": resource.storage_key})
    return Response(
        content=payload,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{resource.title}.json"'},
    )


@router.put(
    "/organizations/{organization_id}/resources/{resource_id}/publish",
    response_model=ResourceResponse,
)
def publish_resource(
    organization_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.publish")),
):
    resource = get_org_resource(db, organization_id, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if resource.visibility == "PUBLIC":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already published")
    resource.visibility = "PUBLIC"
    db.commit()
    db.refresh(resource)
    return ResourceResponse.model_validate(resource)


@router.put(
    "/organizations/{organization_id}/resources/{resource_id}/archive",
    response_model=ResourceResponse,
)
def archive_resource(
    organization_id: int,
    resource_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("resource.archive")),
):
    resource = get_org_resource(db, organization_id, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if resource.visibility == "PRIVATE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Already archived")
    resource.visibility = "PRIVATE"
    db.commit()
    db.refresh(resource)
    return ResourceResponse.model_validate(resource)
