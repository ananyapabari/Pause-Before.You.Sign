"""Pause backend entrypoint and Flask app factory."""

from pathlib import Path

from flask import Flask
from flask_cors import CORS
from sqlalchemy import text

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover
    load_dotenv = None

if load_dotenv:
    load_dotenv(Path(__file__).with_name(".env"))

from config import Config
from extensions import db


def _ensure_offer_analysis_columns() -> None:
    """Add new nullable columns when older databases are missing them."""
    statements = [
        "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS scam_type VARCHAR(50)",
        "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS ai_explanation TEXT",
        "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS review_status VARCHAR(32) DEFAULT 'pending'",
        "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS reviewed_by INTEGER",
        "ALTER TABLE offer_analyses ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE",
    ]
    for statement in statements:
        db.session.execute(text(statement))
    db.session.execute(
        text("UPDATE offer_analyses SET review_status = 'pending' WHERE review_status IS NULL")
    )
    db.session.commit()


def _ensure_scam_report_columns() -> None:
    """Add scam report review columns when older databases are missing them."""
    statements = [
        "ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'pending'",
        "ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE",
        "ALTER TABLE scam_reports ADD COLUMN IF NOT EXISTS reviewed_by INTEGER",
    ]
    for statement in statements:
        db.session.execute(text(statement))
    db.session.execute(
        text("UPDATE scam_reports SET status = 'pending' WHERE status IS NULL")
    )
    db.session.commit()


def create_app() -> Flask:
    """Create and configure the Flask app instance."""
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)

    configured_origins = [origin.strip() for origin in app.config["CORS_ORIGINS"].split(",")]

    # Keep explicit config origins while allowing local Vite dev ports dynamically.
    origins = [
        *configured_origins,
        r"http://localhost:\d+",
        r"http://127\.0\.0\.1:\d+",
    ]
    CORS(app, origins=origins)

    from routes.admin_routes import admin_bp
    from routes.analysis_routes import analysis_bp
    from routes.auth_routes import auth_bp
    from routes.scam_routes import scam_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(analysis_bp, url_prefix="/analysis")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(scam_bp)

    with app.app_context():
        from models.rule_model import RiskRuleRepository

        db.create_all()
        try:
            _ensure_offer_analysis_columns()
            _ensure_scam_report_columns()
        except Exception as exc:
            db.session.rollback()
            print(f"[DB_MIGRATION_WARNING] Could not apply optional schema updates: {exc}")
        RiskRuleRepository.seed_defaults()

    @app.get("/health")
    def health_check():
        return {"status": "ok", "service": "pause-backend"}

    return app


if __name__ == "__main__":
    application = create_app()
    application.run(host="0.0.0.0", port=5000, debug=True)
