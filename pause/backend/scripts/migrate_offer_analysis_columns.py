"""Manual migration helper to add AI/scam columns to offer_analyses."""

from pathlib import Path
import sys

from sqlalchemy import text

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import create_app
from extensions import db


def run_migration() -> None:
    app = create_app()
    with app.app_context():
        statements = [
            "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS scam_type VARCHAR(50)",
            "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS ai_explanation TEXT",
        ]
        for statement in statements:
            db.session.execute(text(statement))
        db.session.commit()
        print("Migration completed: offer_analyses columns ensured.")


if __name__ == "__main__":
    run_migration()
