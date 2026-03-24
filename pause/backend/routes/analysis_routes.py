"""Offer risk analysis routes."""

from flask import Blueprint, jsonify, request

from models.offer_model import OfferAnalysisRepository
from services.risk_engine import RiskEngine
from utils.jwt_utils import jwt_required

analysis_bp = Blueprint("analysis", __name__)
engine = RiskEngine()


@analysis_bp.post("/analyze")
@jwt_required
def analyze_offer():
    payload = request.get_json(silent=True) or {}

    company_name = (payload.get("companyName") or "").strip()
    job_description = (payload.get("jobDescription") or "").strip()
    recruiter_email = (payload.get("recruiterEmail") or "").strip().lower()
    company_website = (payload.get("companyWebsite") or "").strip()

    required = [company_name, job_description, recruiter_email, company_website]
    if not all(required):
        return (
            jsonify(
                {
                    "error": "companyName, jobDescription, recruiterEmail and companyWebsite are required"
                }
            ),
            400,
        )

    result = engine.analyze(
        company_name=company_name,
        job_description=job_description,
        recruiter_email=recruiter_email,
        company_website=company_website,
    )

    OfferAnalysisRepository.create(
        user_id=request.user["sub"],
        company_name=company_name,
        job_description=job_description,
        recruiter_email=recruiter_email,
        company_website=company_website,
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        reasons=result["reasons"],
        scam_type=result["scam_type"],
        ai_explanation=result["ai_explanation"],
    )

    return jsonify(
        {
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "scam_type": result["scam_type"],
            "reasons": result["reasons"],
            "ai_explanation": result["ai_explanation"],
            "meta": result["meta"],
        }
    )


@analysis_bp.get("/history")
@jwt_required
def history():
    records = OfferAnalysisRepository.list_by_user(request.user["sub"])
    return jsonify([record.to_dict() for record in records])
