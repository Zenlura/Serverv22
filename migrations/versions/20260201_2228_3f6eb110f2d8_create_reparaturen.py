"""create_reparaturen

Revision ID: 3f6eb110f2d8
Revises: bf400957e8c7
Create Date: 2026-02-01 22:28:42.172074

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f6eb110f2d8'
down_revision: Union[str, None] = 'bf400957e8c7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
