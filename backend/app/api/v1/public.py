from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.resources import ResourceResponse
from app.services.resource_service import get_public_resource, list_public_resources

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/resources", response_model=list[ResourceResponse])
def get_public_resources(db: Session = Depends(get_db)):
    return [
        ResourceResponse.model_validate(r)
        for r in list_public_resources(db)
    ]


@router.get("/resources/{resource_id}", response_model=ResourceResponse)
def get_public_resource_by_id(
    resource_id: int,
    db: Session = Depends(get_db),
):
    resource = get_public_resource(db, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return ResourceResponse.model_validate(resource)
