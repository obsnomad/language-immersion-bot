"""split profiles by language

Revision ID: b4f7c6a21d13
Revises: 9c5f0b8d1d2e
Create Date: 2026-04-17 22:35:00.000000

"""

from collections import defaultdict
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b4f7c6a21d13"
down_revision: Union[str, Sequence[str], None] = "9c5f0b8d1d2e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    metadata = sa.MetaData()

    old_profiles = sa.Table(
        "user_profiles",
        metadata,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("native_language", sa.String(length=8), nullable=False),
        sa.Column("target_languages", sa.String(length=64), nullable=False),
        sa.Column("current_level", sa.String(length=16), nullable=True),
        sa.Column("preferred_mode", sa.String(length=32), nullable=True),
        sa.Column("feedback_style", sa.String(length=32), nullable=False),
        sa.Column("goals", sa.Text(), nullable=True),
    )

    op.create_table(
        "language_profiles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("native_language", sa.String(length=8), nullable=False),
        sa.Column("current_level", sa.String(length=16), nullable=True),
        sa.Column("preferred_mode", sa.String(length=32), nullable=True),
        sa.Column("feedback_style", sa.String(length=32), nullable=False),
        sa.Column("goals", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "language", name="uq_language_profiles_user_language"),
    )
    op.create_index(
        op.f("ix_language_profiles_user_id"),
        "language_profiles",
        ["user_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_language_profiles_language"),
        "language_profiles",
        ["language"],
        unique=False,
    )

    profiles_result = bind.execute(sa.select(old_profiles)).mappings().all()
    new_profiles = sa.table(
        "language_profiles",
        sa.column("user_id", sa.Integer()),
        sa.column("language", sa.String(length=8)),
        sa.column("native_language", sa.String(length=8)),
        sa.column("current_level", sa.String(length=16)),
        sa.column("preferred_mode", sa.String(length=32)),
        sa.column("feedback_style", sa.String(length=32)),
        sa.column("goals", sa.Text()),
    )

    rows_to_insert: list[dict[str, object | None]] = []
    for profile in profiles_result:
        languages = [
            item.strip().lower()
            for item in str(profile["target_languages"]).split(",")
            if item.strip()
        ]
        for language in languages or ["en"]:
            rows_to_insert.append(
                {
                    "user_id": profile["user_id"],
                    "language": language,
                    "native_language": profile["native_language"],
                    "current_level": profile["current_level"],
                    "preferred_mode": profile["preferred_mode"],
                    "feedback_style": profile["feedback_style"],
                    "goals": profile["goals"],
                }
            )

    if rows_to_insert:
        bind.execute(sa.insert(new_profiles), rows_to_insert)

    op.drop_index(op.f("ix_user_profiles_user_id"), table_name="user_profiles")
    op.drop_table("user_profiles")


def downgrade() -> None:
    bind = op.get_bind()
    metadata = sa.MetaData()

    language_profiles = sa.Table(
        "language_profiles",
        metadata,
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("language", sa.String(length=8), nullable=False),
        sa.Column("native_language", sa.String(length=8), nullable=False),
        sa.Column("current_level", sa.String(length=16), nullable=True),
        sa.Column("preferred_mode", sa.String(length=32), nullable=True),
        sa.Column("feedback_style", sa.String(length=32), nullable=False),
        sa.Column("goals", sa.Text(), nullable=True),
    )

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

    grouped_profiles: dict[int, dict[str, object | None]] = {}
    grouped_languages: defaultdict[int, list[str]] = defaultdict(list)
    for profile in bind.execute(sa.select(language_profiles)).mappings():
        grouped_languages[profile["user_id"]].append(str(profile["language"]))
        grouped_profiles.setdefault(
            profile["user_id"],
            {
                "user_id": profile["user_id"],
                "native_language": profile["native_language"],
                "current_level": profile["current_level"],
                "preferred_mode": profile["preferred_mode"],
                "feedback_style": profile["feedback_style"],
                "goals": profile["goals"],
            },
        )

    rows_to_insert = [
        {
            **profile,
            "target_languages": ",".join(sorted(set(grouped_languages[user_id]))),
        }
        for user_id, profile in grouped_profiles.items()
    ]

    if rows_to_insert:
        bind.execute(
            sa.insert(
                sa.table(
                    "user_profiles",
                    sa.column("user_id", sa.Integer()),
                    sa.column("native_language", sa.String(length=8)),
                    sa.column("target_languages", sa.String(length=64)),
                    sa.column("current_level", sa.String(length=16)),
                    sa.column("preferred_mode", sa.String(length=32)),
                    sa.column("feedback_style", sa.String(length=32)),
                    sa.column("goals", sa.Text()),
                )
            ),
            rows_to_insert,
        )

    op.drop_index(op.f("ix_language_profiles_language"), table_name="language_profiles")
    op.drop_index(op.f("ix_language_profiles_user_id"), table_name="language_profiles")
    op.drop_table("language_profiles")
