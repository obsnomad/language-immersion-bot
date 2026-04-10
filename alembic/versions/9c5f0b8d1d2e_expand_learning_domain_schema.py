"""expand learning domain schema

Revision ID: 9c5f0b8d1d2e
Revises: 637d0b7d010d
Create Date: 2026-04-09 22:35:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "9c5f0b8d1d2e"
down_revision: Union[str, Sequence[str], None] = "637d0b7d010d"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("native_language", sa.String(length=8), nullable=False),
        sa.Column("target_languages", sa.String(length=64), nullable=False),
        sa.Column("current_level", sa.String(length=16), nullable=True),
        sa.Column("preferred_mode", sa.String(length=32), nullable=True),
        sa.Column("feedback_style", sa.String(length=32), nullable=False),
        sa.Column("goals", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id"),
    )
    op.create_index(op.f("ix_user_profiles_user_id"), "user_profiles", ["user_id"], unique=True)

    op.create_table(
        "learning_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("mode", sa.String(length=32), nullable=False),
        sa.Column("agent_role", sa.String(length=64), nullable=False),
        sa.Column("correction_mode", sa.String(length=32), nullable=False),
        sa.Column("scenario_hint", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("started_at", sa.DateTime(), nullable=False),
        sa.Column("ended_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_learning_sessions_user_id"), "learning_sessions", ["user_id"], unique=False)

    op.create_table(
        "message_turns",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("role", sa.String(length=32), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("corrected_text", sa.Text(), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["learning_sessions.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_message_turns_session_id"), "message_turns", ["session_id"], unique=False)

    op.create_table(
        "mistakes",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("type", sa.String(length=32), nullable=False),
        sa.Column("source_text", sa.Text(), nullable=False),
        sa.Column("correction", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("next_review_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mistakes_language"), "mistakes", ["language"], unique=False)
    op.create_index(op.f("ix_mistakes_user_id"), "mistakes", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_mistakes_user_id"), table_name="mistakes")
    op.drop_index(op.f("ix_mistakes_language"), table_name="mistakes")
    op.drop_table("mistakes")
    op.drop_index(op.f("ix_message_turns_session_id"), table_name="message_turns")
    op.drop_table("message_turns")
    op.drop_index(op.f("ix_learning_sessions_user_id"), table_name="learning_sessions")
    op.drop_table("learning_sessions")
    op.drop_index(op.f("ix_user_profiles_user_id"), table_name="user_profiles")
    op.drop_table("user_profiles")
