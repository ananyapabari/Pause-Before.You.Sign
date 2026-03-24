"""Audit log SQLAlchemy model and repository."""

from __future__ import annotations

from datetime import datetime, timezone

from extensions import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    action = db.Column(db.String(120), nullable=False)
    target_type = db.Column(db.String(64), nullable=False, default="system")
    target = db.Column(db.String(255), nullable=False)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "admin_id": self.admin_id,
            "action": self.action,
            "target_type": self.target_type,
            "target": self.target,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


class AuditLogRepository:
    @classmethod
    def add(
        cls,
        admin_id: int,
        action: str,
        target: str,
        *,
        target_type: str = "system",
        details: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            admin_id=admin_id,
            action=action,
            target_type=target_type,
            target=target,
            details=details,
        )
        db.session.add(log)
        db.session.commit()
        return log

    @classmethod
    def list_all(cls) -> list[AuditLog]:
        return AuditLog.query.order_by(AuditLog.timestamp.asc()).all()
