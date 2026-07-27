from sqlalchemy.orm import Session

from app.database.models.membership import Membership
from app.database.models.role import Role
from app.database.models.user import User
from app.schemas.memberships import MembershipCreate, MembershipUpdate


def _get_caller_rank(db: Session, caller: User, org_id: int) -> int:
    if caller.is_super_admin:
        return 0
    membership = (
        db.query(Membership)
        .filter(
            Membership.user_id == caller.id,
            Membership.organization_id == org_id,
            Membership.status == "ACTIVE",
        )
        .first()
    )
    if not membership:
        return -1
    role = db.query(Role).filter(Role.id == membership.role_id).first()
    return role.rank if role else -1


def list_members(db: Session, organization_id: int) -> list[Membership]:
    return (
        db.query(Membership)
        .filter(Membership.organization_id == organization_id)
        .all()
    )


def get_member(db: Session, organization_id: int, member_id: int) -> Membership | None:
    return (
        db.query(Membership)
        .filter(
            Membership.id == member_id,
            Membership.organization_id == organization_id,
        )
        .first()
    )


def upsert_member(
    db: Session,
    organization_id: int,
    data: MembershipCreate,
    caller: User,
) -> Membership:
    target_role = db.query(Role).filter(Role.id == data.role_id).first()
    if target_role is None:
        raise ValueError("Role not found")

    caller_rank = _get_caller_rank(db, caller, organization_id)
    if caller_rank < 0:
        raise ValueError("Not found")
    if caller_rank >= target_role.rank:
        raise ValueError("Not found")

    existing = (
        db.query(Membership)
        .filter(
            Membership.user_id == data.user_id,
            Membership.organization_id == organization_id,
        )
        .first()
    )
    if existing:
        existing.role_id = data.role_id
        existing.status = "ACTIVE"
        db.commit()
        db.refresh(existing)
        return existing

    membership = Membership(
        user_id=data.user_id,
        organization_id=organization_id,
        role_id=data.role_id,
        status="ACTIVE",
    )
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


def update_member(
    db: Session,
    organization_id: int,
    member: Membership,
    data: MembershipUpdate,
    caller: User,
) -> Membership:
    if data.role_id is not None:
        target_role = db.query(Role).filter(Role.id == data.role_id).first()
        if target_role is None:
            raise ValueError("Not found")

        caller_rank = _get_caller_rank(db, caller, organization_id)
        if caller_rank < 0:
            raise ValueError("Not found")
        if caller_rank >= target_role.rank:
            raise ValueError("Not found")

        member.role_id = data.role_id

    if data.status is not None:
        member.status = data.status

    db.commit()
    db.refresh(member)
    return member


def delete_member(db: Session, member: Membership) -> None:
    db.delete(member)
    db.commit()
