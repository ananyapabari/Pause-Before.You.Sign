"""Scam reporting routes."""

from flask import Blueprint, jsonify, request

from models.scam_report_model import ScamReportRepository
from utils.domain_utils import extract_domain
from utils.jwt_utils import jwt_required

scam_bp = Blueprint("scam", __name__)


@scam_bp.post("/report-scam")
@jwt_required
def report_scam():
    payload = request.get_json(silent=True) or {}

    company_name = (payload.get("company_name") or payload.get("companyName") or "").strip()
    raw_domain = (
        payload.get("domain")
        or payload.get("company_website")
        or payload.get("companyWebsite")
        or ""
    ).strip()
    email = (payload.get("email") or payload.get("recruiterEmail") or "").strip().lower()
    description = (payload.get("description") or "").strip()
    reason = (payload.get("reason") or "").strip()

    if not company_name:
        return jsonify({"error": "companyName is required"}), 400

    if not reason:
        return jsonify({"error": "reason is required"}), 400

    domain = extract_domain(raw_domain) if raw_domain else ""
    if not domain and not email:
        return jsonify({"error": "Either domain/companyWebsite or email is required"}), 400

    user_id = int(request.user["sub"])

    if ScamReportRepository.is_duplicate_report(user_id=user_id, domain=domain, email=email):
        return jsonify({"error": "You have already reported this source"}), 409

    report = ScamReportRepository.create(
        user_id=user_id,
        company_name=company_name,
        domain=domain,
        email=email,
        description=description,
        reason=reason,
    )

    return jsonify({"message": "Scam report submitted", "report": report.to_dict()}), 201


@scam_bp.get("/scam-reports/count")
@jwt_required
def scam_report_count():
    domain_param = (request.args.get("domain") or "").strip()
    email = (request.args.get("email") or "").strip().lower()
    domain = extract_domain(domain_param) if domain_param else ""

    if not domain and not email:
        return jsonify({"error": "Provide domain or email query parameter"}), 400

    count = ScamReportRepository.count_by_domain_or_email(domain=domain, email=email)
    return jsonify({"count": count, "domain": domain or None, "email": email or None})
