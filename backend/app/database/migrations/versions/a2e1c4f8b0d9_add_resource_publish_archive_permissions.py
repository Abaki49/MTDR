"""add resource.publish and resource.archive permissions

Revision ID: a2e1c4f8b0d9
Revises: 839c5ccf3173
Create Date: 2026-07-27 17:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2e1c4f8b0d9'
down_revision: Union[str, None] = '839c5ccf3173'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        INSERT INTO permissions (name) VALUES ('resource.publish'), ('resource.archive')
        ON CONFLICT (name) DO NOTHING
    """)
    op.execute("""
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT 1, id FROM permissions WHERE name IN ('resource.publish', 'resource.archive')
        ON CONFLICT DO NOTHING
    """)


def downgrade() -> None:
    op.execute("""
        DELETE FROM role_permissions WHERE permission_id IN (
            SELECT id FROM permissions WHERE name IN ('resource.publish', 'resource.archive')
        )
    """)
    op.execute("""
        DELETE FROM permissions WHERE name IN ('resource.publish', 'resource.archive')
    """)
