import re
from typing import Any

from sqlalchemy.orm import Session

from app.database.models.organization import Organization
from app.schemas.organizations import OrganizationCreate, OrganizationUpdate


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9\ -]", "", text)
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def _resolve_slug(db: Session, name: str, slug: str | None, exclude_id: int | None = None) -> str:
    if not slug:
        slug = _slugify(name)
    candidate = slug
    suffix = 1
    while True:
        q = db.query(Organization).filter(Organization.slug == candidate)
        if exclude_id is not None:
            q = q.filter(Organization.id != exclude_id)
        if not q.first():
            return candidate
        suffix += 1
        candidate = f"{slug}-{suffix}"


def list_organizations(
    db: Session,
    limit: int = 20,
    cursor: int | None = None,
) -> tuple[list[Organization], int | None]:
    q = db.query(Organization).order_by(Organization.id.asc())
    if cursor is not None:
        q = q.filter(Organization.id > cursor)
    items = q.limit(limit).all()
    next_cursor = items[-1].id if len(items) == limit else None
    return items, next_cursor


def get_organization(db: Session, organization_id: int) -> Organization | None:
    return db.query(Organization).filter(Organization.id == organization_id).first()


def create_organization(db: Session, data: OrganizationCreate) -> Organization:
    slug = _resolve_slug(db, data.name, data.slug)
    org = Organization(name=data.name, slug=slug, description=data.description)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org


def update_organization(db: Session, org: Organization, data: OrganizationUpdate) -> Organization:
    if data.name is not None:
        org.name = data.name
    if data.slug is not None or data.name is not None:
        new_slug = data.slug if data.slug is not None else _slugify(data.name)
        org.slug = _resolve_slug(db, org.name, new_slug, exclude_id=org.id)
    if data.description is not None:
        org.description = data.description
    db.commit()
    db.refresh(org)
    return org


def delete_organization(db: Session, org: Organization) -> None:
    db.delete(org)
    db.commit()
