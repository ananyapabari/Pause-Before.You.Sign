"""Offer analysis SQLAlchemy model and repository."""

from __future__ import annotations

from datetime import datetime, timezone

from extensions import db


class OfferAnalysis(db.Model):
    __tablename__ = "offer_analyses"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    company_name = db.Column(db.String(255), nullable=False)
    job_description = db.Column(db.Text, nullable=False)
    recruiter_email = db.Column(db.String(255), nullable=False)
    company_website = db.Column(db.String(255), nullable=False)
    risk_score = db.Column(db.Integer, nullable=False)
    risk_level = db.Column(db.String(20), nullable=False)
    scam_type = db.Column(db.String(50), nullable=True)
    reasons = db.Column(db.JSON, nullable=False, default=list)
    ai_explanation = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    review_status = db.Column(db.String(32), nullable=False, default="pending")
    reviewed_by = db.Column(db.Integer, nullable=True)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    user = db.relationship("User", back_populates="offers")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "company_name": self.company_name,
            "job_description": self.job_description,
            "recruiter_email": self.recruiter_email,
            "company_website": self.company_website,
            "risk_score": self.risk_score,
            "risk_level": self.risk_level,
            "scam_type": self.scam_type,
            "reasons": self.reasons or [],
            "ai_explanation": self.ai_explanation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "review_status": self.review_status,
            "reviewed_by": self.reviewed_by,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None,
        }


class OfferAnalysisRepository:
    """Database-backed offer analysis operations."""

    @classmethod
    def create(
        cls,
        user_id: int,
        company_name: str,
        job_description: str,
        recruiter_email: str,
        company_website: str,
        risk_score: int,
        risk_level: str,
        reasons: list[str],
        scam_type: str = None,
        ai_explanation: str = None,
    ) -> OfferAnalysis:
        record = OfferAnalysis(
            user_id=user_id,
            company_name=company_name,
            job_description=job_description,
            recruiter_email=recruiter_email,
            company_website=company_website,
            risk_score=risk_score,
            risk_level=risk_level,
            scam_type=scam_type,
            reasons=reasons,
            ai_explanation=ai_explanation,
            review_status="pending",
            reviewed_by=None,
            reviewed_at=None,
        )
        db.session.add(record)
        db.session.commit()
        return record

    @classmethod
    def list_by_user(cls, user_id: int) -> list[OfferAnalysis]:
        return OfferAnalysis.query.filter_by(user_id=user_id).order_by(OfferAnalysis.created_at.desc()).all()

    @classmethod
    def list_all(cls) -> list[OfferAnalysis]:
        return OfferAnalysis.query.order_by(OfferAnalysis.created_at.asc()).all()

    @classmethod
    def list_high_risk(cls) -> list[OfferAnalysis]:
        return (
            OfferAnalysis.query.filter_by(risk_level="HIGH")
            .order_by(OfferAnalysis.created_at.desc())
            .all()
        )

    @classmethod
    def find_by_id(cls, record_id: int) -> OfferAnalysis | None:
        return db.session.get(OfferAnalysis, record_id)

    @classmethod
    def mark_review(cls, record_id: int, *, status: str, admin_id: int) -> OfferAnalysis | None:
        record = cls.find_by_id(record_id)
        if not record:
            return None

        record.review_status = status
        record.reviewed_by = admin_id
        record.reviewed_at = datetime.now(timezone.utc)
        db.session.commit()
        return record
