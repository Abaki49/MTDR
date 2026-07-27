from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.authorization import require_super_admin
from app.database.session import get_db
from app.schemas.organizations import (
    OrganizationCreate,
    OrganizationResponse,
    OrganizationUpdate,
    PaginatedResponse,
)
from app.services.organization_service import (
    create_organization,
    delete_organization,
    get_organization,
    list_organizations,
    update_organization,
)

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"],
    dependencies=[Depends(require_super_admin)],
)


@router.get("", response_model=PaginatedResponse[OrganizationResponse])
def get_organizations(
    limit: int = Query(20, ge=1, le=100),
    cursor: int | None = Query(None, ge=1),
    db: Session = Depends(get_db),
):
    items, next_cursor = list_organizations(db, limit=limit, cursor=cursor)
    return PaginatedResponse(
        items=[OrganizationResponse.model_validate(o) for o in items],
        next_cursor=str(next_cursor) if next_cursor is not None else None,
    )


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def post_organization(
    body: OrganizationCreate,
    db: Session = Depends(get_db),
):
    org = create_organization(db, body)
    return OrganizationResponse.model_validate(org)


@router.get("/{organization_id}", response_model=OrganizationResponse)
def get_organization_by_id(
    organization_id: int,
    db: Session = Depends(get_db),
):
    org = get_organization(db, organization_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return OrganizationResponse.model_validate(org)


@router.put("/{organization_id}", response_model=OrganizationResponse)
def put_organization(
    organization_id: int,
    body: OrganizationUpdate,
    db: Session = Depends(get_db),
):
    org = get_organization(db, organization_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    org = update_organization(db, org, body)
    return OrganizationResponse.model_validate(org)


@router.delete("/{organization_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization_by_id(
    organization_id: int,
    db: Session = Depends(get_db),
):
    org = get_organization(db, organization_id)
    if org is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    delete_organization(db, org)
