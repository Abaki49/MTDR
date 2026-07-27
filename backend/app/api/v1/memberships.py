from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from starlette import status as http_status

from app.core.authorization import require_permission
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.memberships import (
    MembershipCreate,
    MembershipResponse,
    MembershipUpdate,
)
from app.services.membership_service import (
    delete_member,
    get_member,
    list_members,
    update_member,
    upsert_member,
)

router = APIRouter(tags=["memberships"])


@router.get(
    "/organizations/{organization_id}/members",
    response_model=list[MembershipResponse],
)
def get_members(
    organization_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("membership.read")),
):
    return [
        MembershipResponse.model_validate(m)
        for m in list_members(db, organization_id)
    ]


@router.post(
    "/organizations/{organization_id}/members",
    response_model=MembershipResponse,
    status_code=http_status.HTTP_201_CREATED,
)
def post_member(
    organization_id: int,
    body: MembershipCreate,
    db: Session = Depends(get_db),
    caller: User = Depends(require_permission("membership.create")),
):
    try:
        member = upsert_member(db, organization_id, body, caller)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        ) from e
    return MembershipResponse.model_validate(member)


@router.get(
    "/organizations/{organization_id}/members/{member_id}",
    response_model=MembershipResponse,
)
def get_member_by_id(
    organization_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("membership.read")),
):
    member = get_member(db, organization_id, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    return MembershipResponse.model_validate(member)


@router.put(
    "/organizations/{organization_id}/members/{member_id}",
    response_model=MembershipResponse,
)
def put_member(
    organization_id: int,
    member_id: int,
    body: MembershipUpdate,
    db: Session = Depends(get_db),
    caller: User = Depends(require_permission("membership.update")),
):
    member = get_member(db, organization_id, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    try:
        updated = update_member(db, organization_id, member, body, caller)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        ) from e
    return MembershipResponse.model_validate(updated)


@router.delete(
    "/organizations/{organization_id}/members/{member_id}",
    status_code=http_status.HTTP_204_NO_CONTENT,
)
def delete_member_by_id(
    organization_id: int,
    member_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("membership.delete")),
):
    member = get_member(db, organization_id, member_id)
    if member is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    delete_member(db, member)
