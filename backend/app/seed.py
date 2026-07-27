from app.database.base import Base
from app.database.session import engine, SessionLocal
from app.core.security import hash_password
from app.database.models.user import User
from app.database.models.organization import Organization
from app.database.models.role import Role
from app.database.models.membership import Membership
from app.database.models.permission import Permission
from app.database.models.role_permission import RolePermission


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if db.query(User).first():
            print("DB already seeded, skipping.")
            return

        admin = User(
            name="Admin",
            email="admin@test.com",
            password_hash=hash_password("admin123"),
            is_super_admin=True,
            is_active=True,
        )
        user = User(
            name="User",
            email="user@test.com",
            password_hash=hash_password("user123"),
            is_super_admin=False,
            is_active=True,
        )
        member = User(
            name="Member",
            email="member@test.com",
            password_hash=hash_password("member123"),
            is_super_admin=False,
            is_active=True,
        )
        db.add_all([admin, user, member])
        db.flush()

        org = Organization(
            name="Test Organization",
            slug="test-organization",
        )
        db.add(org)
        db.flush()

        role_admin = Role(name="Org Admin", is_system=True, rank=1)
        role_editor = Role(name="Editor", is_system=True, rank=2)
        db.add_all([role_admin, role_editor])
        db.flush()

        db.add(Membership(user_id=user.id, organization_id=org.id, role_id=role_admin.id, status="ACTIVE"))
        db.add(Membership(user_id=member.id, organization_id=org.id, role_id=role_editor.id, status="ACTIVE"))
        db.flush()

        perms = [
            Permission(name="membership.read"),
            Permission(name="membership.create"),
            Permission(name="membership.update"),
            Permission(name="membership.delete"),
            Permission(name="resource.read"),
            Permission(name="resource.create"),
            Permission(name="resource.update"),
            Permission(name="resource.delete"),
        ]
        db.add_all(perms)
        db.flush()

        for p in perms:
            db.add(RolePermission(role_id=role_admin.id, permission_id=p.id))

        for p in perms:
            if p.name in ("resource.read", "resource.create", "resource.update"):
                db.add(RolePermission(role_id=role_editor.id, permission_id=p.id))

        db.commit()
        print("Seed complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
