"""Risk rule SQLAlchemy model and repository."""

from __future__ import annotations

from typing import Optional

from extensions import db


class RiskRule(db.Model):
    __tablename__ = "risk_rules"

    id = db.Column(db.Integer, primary_key=True)
    rule_name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    weight = db.Column(db.Integer, nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=True)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "rule_name": self.rule_name,
            "description": self.description,
            "weight": self.weight,
            "enabled": self.enabled,
        }


class RiskRuleRepository:
    """Persistent rule config with default seed values."""

    DEFAULT_RULES = [
        {
            "rule_name": "domain_age_lt_90_days",
            "description": "Flags domains registered in the last 90 days.",
            "weight": 40,
            "enabled": True,
        },
        {
            "rule_name": "domain_age_lt_1_year",
            "description": "Flags domains younger than one year.",
            "weight": 20,
            "enabled": True,
        },
        {
            "rule_name": "free_email_domain",
            "description": "Detects recruiter emails using free/public providers.",
            "weight": 22,
            "enabled": True,
        },
        {
            "rule_name": "payment_request",
            "description": "Detects any request for upfront payment in offer text.",
            "weight": 28,
            "enabled": True,
        },
        {
            "rule_name": "urgency_language",
            "description": "Detects pressure tactics and urgency-based wording.",
            "weight": 20,
            "enabled": True,
        },
        {
            "rule_name": "website_not_https",
            "description": "Flags company websites that are not using HTTPS.",
            "weight": 15,
            "enabled": True,
        },
        {
            "rule_name": "suspicious_domain_impersonation",
            "description": "Detects lookalike domains that mimic known brands.",
            "weight": 30,
            "enabled": True,
        },
    ]

    @classmethod
    def seed_defaults(cls) -> None:
        if RiskRule.query.count() > 0:
            return

        for item in cls.DEFAULT_RULES:
            db.session.add(RiskRule(**item))
        db.session.commit()

    @classmethod
    def list_all(cls) -> list[RiskRule]:
        return RiskRule.query.order_by(RiskRule.id.asc()).all()

    @classmethod
    def find_by_name(cls, rule_name: str) -> Optional[RiskRule]:
        return RiskRule.query.filter_by(rule_name=rule_name).first()

    @classmethod
    def update_rule(
        cls,
        rule_name: str,
        weight: Optional[int] = None,
        enabled: Optional[bool] = None,
    ) -> Optional[RiskRule]:
        rule = cls.find_by_name(rule_name)
        if not rule:
            return None

        if weight is not None:
            rule.weight = weight
        if enabled is not None:
            rule.enabled = enabled

        db.session.commit()
        return rule
