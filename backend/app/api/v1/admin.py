from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.authorization import require_super_admin
from app.database.models.membership import Membership
from app.database.models.organization import Organization
from app.database.models.user import User
from app.database.session import get_db
from app.schemas.organizations import OrganizationResponse

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_super_admin)])


@router.get("/stats")
def get_admin_stats(db: Session = Depends(get_db)):
    org_count = db.query(Organization).count()
    member_count = db.query(Membership).count()
    active_member_count = db.query(Membership).filter(Membership.status == "ACTIVE").count()
    user_count = db.query(User).count()
    return {
        "organizations": org_count,
        "members": member_count,
        "active_members": active_member_count,
        "users": user_count,
    }


@router.get("/organizations", response_model=list[OrganizationResponse])
def get_all_organizations(db: Session = Depends(get_db)):
    orgs = db.query(Organization).order_by(Organization.id.asc()).all()
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.asc()).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "is_super_admin": u.is_super_admin,
            "is_active": u.is_active,
        }
        for u in users
    ]
