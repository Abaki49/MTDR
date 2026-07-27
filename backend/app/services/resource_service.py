from sqlalchemy.orm import Session

from app.database.models.resource import Resource
from app.schemas.resources import ResourceCreate, ResourceUpdate


def list_org_resources(db: Session, organization_id: int) -> list[Resource]:
    return (
        db.query(Resource)
        .filter(Resource.organization_id == organization_id)
        .all()
    )


def get_org_resource(
    db: Session, organization_id: int, resource_id: int
) -> Resource | None:
    return (
        db.query(Resource)
        .filter(
            Resource.id == resource_id,
            Resource.organization_id == organization_id,
        )
        .first()
    )


def create_resource(
    db: Session, organization_id: int, data: ResourceCreate, created_by: int
) -> Resource:
    resource = Resource(
        organization_id=organization_id,
        title=data.title,
        description=data.description,
        storage_key=data.storage_key,
        visibility=data.visibility,
        created_by=created_by,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


def update_resource(
    db: Session, resource: Resource, data: ResourceUpdate
) -> Resource:
    if data.title is not None:
        resource.title = data.title
    if data.description is not None:
        resource.description = data.description
    if data.storage_key is not None:
        resource.storage_key = data.storage_key
    if data.visibility is not None:
        resource.visibility = data.visibility
    db.commit()
    db.refresh(resource)
    return resource


def delete_resource(db: Session, resource: Resource) -> None:
    db.delete(resource)
    db.commit()


def list_public_resources(db: Session) -> list[Resource]:
    return (
        db.query(Resource)
        .filter(Resource.visibility == "PUBLIC")
        .all()
    )


def get_public_resource(db: Session, resource_id: int) -> Resource | None:
    return (
        db.query(Resource)
        .filter(
            Resource.id == resource_id,
            Resource.visibility == "PUBLIC",
        )
        .first()
    )
