"""create_organization_role_permissions

Revision ID: 6b94595b9d9b
Revises: d3a59c01ae04
Create Date: 2026-07-27 16:31:18.160161

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '6b94595b9d9b'
down_revision: Union[str, None] = 'd3a59c01ae04'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'organization_role_permissions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('organization_id', sa.Integer(), nullable=False),
        sa.Column('role_id', sa.Integer(), nullable=False),
        sa.Column('permission_id', sa.Integer(), nullable=False),
        sa.Column('allowed', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['permission_id'], ['permissions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('organization_id', 'role_id', 'permission_id', name='uq_org_role_permission'),
    )
    op.create_index(
        op.f('ix_organization_role_permissions_organization_id'),
        'organization_role_permissions',
        ['organization_id'],
    )
    op.create_index(
        op.f('ix_organization_role_permissions_role_id'),
        'organization_role_permissions',
        ['role_id'],
    )


def downgrade() -> None:
    op.drop_table('organization_role_permissions')
