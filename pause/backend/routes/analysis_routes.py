"""Offer risk analysis routes."""

from io import BytesIO

from flask import Blueprint, jsonify, request, send_file

from models.offer_model import OfferAnalysisRepository
from services.risk_engine import RiskEngine
from services.pdf_service import PDFService
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

    analysis_record = OfferAnalysisRepository.create(
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
            "id": analysis_record.id,
            "risk_score": result["risk_score"],
            "risk_level": result["risk_level"],
            "scam_type": result["scam_type"],
            "is_previously_reported": result["is_previously_reported"],
            "reports_count": result["reports_count"],
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


@analysis_bp.get("/export-report/<int:analysis_id>")
@jwt_required
def export_report(analysis_id):
    """Export an analysis as a PDF report."""
    # Fetch the analysis record
    record = OfferAnalysisRepository.find_by_id(analysis_id)
    if not record:
        return jsonify({"error": "Analysis not found"}), 404

    # Verify ownership (user can only download their own reports)
    if record.user_id != request.user["sub"]:
        return jsonify({"error": "Unauthorized"}), 403

    # Prepare analysis data for PDF generation
    analysis_data = {
        "company_name": record.company_name,
        "job_description": record.job_description,
        "recruiter_email": record.recruiter_email,
        "company_website": record.company_website,
        "risk_score": record.risk_score,
        "risk_level": record.risk_level,
        "scam_type": record.scam_type,
        "reasons": record.reasons or [],
        "ai_explanation": record.ai_explanation,
        "is_previously_reported": False,
        "reports_count": 0,
    }

    # Check if previously reported
    from models.scam_report_model import ScamReportRepository

    reports_count = ScamReportRepository.count_by_domain_or_email(
        domain=record.company_name, email=record.recruiter_email
    )
    if reports_count > 0:
        analysis_data["is_previously_reported"] = True
        analysis_data["reports_count"] = reports_count

    # Generate PDF
    try:
        pdf_bytes = PDFService.generate_report(analysis_data)
        filename = f"risk_analysis_{record.company_name.replace(' ', '_')}_{record.id}.pdf"

        return send_file(
            BytesIO(pdf_bytes),
            mimetype="application/pdf",
            as_attachment=True,
            download_name=filename,
        )
    except Exception as e:
        print(f"[EXPORT_ERROR] PDF generation failed: {str(e)}")
        return jsonify({"error": "Failed to generate PDF"}), 500

