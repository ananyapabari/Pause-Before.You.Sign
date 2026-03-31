"""Scam report SQLAlchemy model and repository."""

from __future__ import annotations

from datetime import datetime, timezone

from extensions import db
from utils.domain_utils import extract_domain


class ScamReport(db.Model):
    __tablename__ = "scam_reports"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    company_name = db.Column(db.String(255), nullable=False)
    domain = db.Column(db.String(255), nullable=True, index=True)
    email = db.Column(db.String(255), nullable=True, index=True)
    description = db.Column(db.Text, nullable=True)
    reason = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="pending", index=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    reviewed_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", back_populates="scam_reports", foreign_keys=[user_id])

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "domain": self.domain,
            "email": self.email,
            "description": self.description,
            "reason": self.reason,
            "status": self.status,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
            "reviewed_by": self.reviewed_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ScamReportRepository:
    """Database-backed scam report operations."""

    @staticmethod
    def _normalize(value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip().lower()
        return normalized or None

    @classmethod
    def is_duplicate_report(cls, *, user_id: int, domain: str | None, email: str | None) -> bool:
        domain = cls._normalize(domain)
        email = cls._normalize(email)

        if not domain and not email:
            return False

        clauses = []
        if domain:
            clauses.append(ScamReport.domain == domain)
        if email:
            clauses.append(ScamReport.email == email)

        return (
            ScamReport.query.filter(ScamReport.user_id == user_id)
            .filter(db.or_(*clauses))
            .first()
            is not None
        )

    @classmethod
    def create(
        cls,
        *,
        user_id: int,
        company_name: str,
        domain: str | None,
        email: str | None,
        description: str | None,
        reason: str,
    ) -> ScamReport:
        report = ScamReport(
            user_id=user_id,
            company_name=company_name.strip(),
            domain=cls._normalize(domain),
            email=cls._normalize(email),
            description=(description or "").strip() or None,
            reason=reason.strip(),
        )
        db.session.add(report)
        db.session.commit()
        return report

    @classmethod
    def count_by_domain_or_email(cls, *, domain: str | None, email: str | None) -> int:
        domain = cls._normalize(domain)
        email = cls._normalize(email)

        if not domain and not email:
            return 0

        clauses = []
        if domain:
            clauses.append(ScamReport.domain == domain)
        if email:
            clauses.append(ScamReport.email == email)

        return ScamReport.query.filter(db.or_(*clauses)).count()

    @classmethod
    def count_for_offer_source(
        cls,
        *,
        company_website: str | None,
        recruiter_email: str | None,
    ) -> int:
        domain = extract_domain(company_website or "") if company_website else ""
        email = (recruiter_email or "").strip().lower()
        return cls.count_by_domain_or_email(domain=domain, email=email)

    @staticmethod
    def list_all() -> list[ScamReport]:
        return ScamReport.query.order_by(ScamReport.created_at.desc()).all()

    @classmethod
    def domain_email_counts(cls) -> tuple[dict[str, int], dict[str, int]]:
        domain_rows = (
            db.session.query(ScamReport.domain, db.func.count(ScamReport.id))
            .filter(ScamReport.domain.isnot(None))
            .group_by(ScamReport.domain)
            .all()
        )
        email_rows = (
            db.session.query(ScamReport.email, db.func.count(ScamReport.id))
            .filter(ScamReport.email.isnot(None))
            .group_by(ScamReport.email)
            .all()
        )
        domain_counts = {domain: count for domain, count in domain_rows if domain}
        email_counts = {email: count for email, count in email_rows if email}
        return domain_counts, email_counts

    @classmethod
    def mark_reviewed(cls, report_id: int, admin_id: int) -> ScamReport | None:
        report = ScamReport.query.get(report_id)
        if not report:
            return None

        report.status = "reviewed"
        report.reviewed_by = admin_id
        report.reviewed_at = datetime.now(timezone.utc)
        db.session.commit()
        return report
