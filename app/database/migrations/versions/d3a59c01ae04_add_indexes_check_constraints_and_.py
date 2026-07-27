"""add indexes check constraints and server defaults

Revision ID: d3a59c01ae04
Revises: a9f577fb8429
Create Date: 2026-07-27 16:08:54.269686

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd3a59c01ae04'
down_revision: Union[str, None] = 'a9f577fb8429'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index(op.f('ix_memberships_organization_id'), 'memberships', ['organization_id'], unique=False)
    op.create_index(op.f('ix_memberships_role_id'), 'memberships', ['role_id'], unique=False)
    op.create_index(op.f('ix_memberships_user_id'), 'memberships', ['user_id'], unique=False)
    op.create_index(op.f('ix_resources_created_by'), 'resources', ['created_by'], unique=False)
    op.create_index(op.f('ix_resources_organization_id'), 'resources', ['organization_id'], unique=False)
    op.create_check_constraint("ck_membership_status", "memberships", "status IN ('ACTIVE', 'SUSPENDED', 'INVITED')")
    op.create_check_constraint("ck_resource_visibility", "resources", "visibility IN ('PUBLIC', 'PRIVATE')")


def downgrade() -> None:
    op.drop_constraint("ck_resource_visibility", "resources", type_="check")
    op.drop_constraint("ck_membership_status", "memberships", type_="check")
    op.drop_index(op.f('ix_resources_organization_id'), table_name='resources')
    op.drop_index(op.f('ix_resources_created_by'), table_name='resources')
    op.drop_index(op.f('ix_memberships_user_id'), table_name='memberships')
    op.drop_index(op.f('ix_memberships_role_id'), table_name='memberships')
    op.drop_index(op.f('ix_memberships_organization_id'), table_name='memberships')
