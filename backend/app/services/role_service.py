from sqlalchemy.orm import Session

from app.database.models.role import Role


def list_roles(db: Session) -> list[Role]:
    return db.query(Role).order_by(Role.rank).all()
