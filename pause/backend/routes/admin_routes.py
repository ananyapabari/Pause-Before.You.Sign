"""Admin routes for rule management and operations visibility."""

from flask import Blueprint, jsonify, request

from models.audit_log_model import AuditLogRepository
from models.offer_model import OfferAnalysisRepository
from models.rule_model import RiskRuleRepository
from models.user_model import UserRepository
from utils.jwt_utils import admin_required

admin_bp = Blueprint("admin", __name__)


@admin_bp.get("/dashboard")
@admin_required
def dashboard():
    offers = OfferAnalysisRepository.list_all()
    high_risk = [offer for offer in offers if offer.risk_level == "HIGH"]
    medium_risk = [offer for offer in offers if offer.risk_level == "MEDIUM"]
    low_risk = [offer for offer in offers if offer.risk_level == "LOW"]
    recent_flagged = [offer.to_dict() for offer in high_risk[-5:]][::-1]

    return jsonify(
        {
            "total_offers_analyzed": len(offers),
            "high_risk_detections": len(high_risk),
            "risk_distribution": {
                "HIGH": len(high_risk),
                "MEDIUM": len(medium_risk),
                "LOW": len(low_risk),
            },
            "recent_reports": [offer.to_dict() for offer in offers[-5:]][::-1],
            "recent_flagged_activity": recent_flagged,
        }
    )


@admin_bp.get("/users")
@admin_required
def list_users():
    search = request.args.get("search")
    role = request.args.get("role")
    status = request.args.get("status")

    users = UserRepository.list_filtered(search=search, role=role, status=status)
    payload = [
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
        for user in users
    ]
    return jsonify(payload)


@admin_bp.put("/users/<int:user_id>/status")
@admin_required
def update_user_status(user_id: int):
    payload = request.get_json(silent=True) or {}
    is_active = payload.get("is_active")

    if not isinstance(is_active, bool):
        return jsonify({"error": "is_active must be a boolean"}), 400

    if user_id == request.user["sub"]:
        return jsonify({"error": "You cannot disable your own account."}), 400

    user = UserRepository.update_status(user_id, is_active=is_active)
    if not user:
        return jsonify({"error": "User not found"}), 404

    AuditLogRepository.add(
        admin_id=request.user["sub"],
        action="UPDATE_USER_STATUS",
        target=user.email,
        target_type="user",
        details=f"is_active={str(is_active).lower()}",
    )

    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
    )


@admin_bp.put("/users/<int:user_id>/role")
@admin_required
def update_user_role(user_id: int):
    payload = request.get_json(silent=True) or {}
    role = (payload.get("role") or "").strip().lower()

    if role not in {"user", "admin"}:
        return jsonify({"error": "role must be either 'user' or 'admin'"}), 400

    if user_id == request.user["sub"] and role != "admin":
        return jsonify({"error": "You cannot demote your own admin role."}), 400

    user = UserRepository.update_role(user_id, role=role)
    if not user:
        return jsonify({"error": "User not found"}), 404

    AuditLogRepository.add(
        admin_id=request.user["sub"],
        action="UPDATE_USER_ROLE",
        target=user.email,
        target_type="user",
        details=f"role={role}",
    )

    return jsonify(
        {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at,
        }
    )


@admin_bp.delete("/users/<int:user_id>")
@admin_required
def delete_user(user_id: int):
    if user_id == request.user["sub"]:
        return jsonify({"error": "You cannot delete your own account."}), 400

    user = UserRepository.find_by_id(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    deleted = UserRepository.delete_by_id(user_id)
    if not deleted:
        return jsonify({"error": "User not found"}), 404

    AuditLogRepository.add(
        admin_id=request.user["sub"],
        action="DELETE_USER",
        target=user.email,
        target_type="user",
    )

    return jsonify({"message": "User deleted"})


@admin_bp.get("/flagged-offers")
@admin_required
def list_flagged_offers():
    flagged = [offer.to_dict() for offer in OfferAnalysisRepository.list_high_risk()]
    return jsonify(flagged[::-1])


@admin_bp.put("/flagged-offers/<int:offer_id>/review")
@admin_required
def review_flagged_offer(offer_id: int):
    payload = request.get_json(silent=True) or {}
    status = (payload.get("status") or "").strip().lower()

    if status not in {"reviewed", "false_positive"}:
        return jsonify({"error": "status must be reviewed or false_positive"}), 400

    offer = OfferAnalysisRepository.mark_review(offer_id, status=status, admin_id=request.user["sub"])
    if not offer:
        return jsonify({"error": "Offer not found"}), 404

    AuditLogRepository.add(
        admin_id=request.user["sub"],
        action="REVIEW_FLAGGED_OFFER",
        target=f"offer:{offer_id}",
        target_type="offer",
        details=f"status={status}",
    )

    return jsonify(offer.to_dict())


@admin_bp.get("/rules")
@admin_required
def list_rules():
    rules = [rule.to_dict() for rule in RiskRuleRepository.list_all()]
    return jsonify(rules)


@admin_bp.put("/rules/<string:rule_name>")
@admin_required
def update_rule(rule_name: str):
    payload = request.get_json(silent=True) or {}
    weight = payload.get("weight")
    enabled = payload.get("enabled")

    if weight is not None:
        try:
            weight = int(weight)
        except (TypeError, ValueError):
            return jsonify({"error": "weight must be an integer"}), 400

    if enabled is not None and not isinstance(enabled, bool):
        return jsonify({"error": "enabled must be a boolean"}), 400

    rule = RiskRuleRepository.update_rule(rule_name, weight=weight, enabled=enabled)
    if not rule:
        return jsonify({"error": "Rule not found"}), 404

    AuditLogRepository.add(
        admin_id=request.user["sub"],
        action="UPDATE_RULE",
        target=rule_name,
        target_type="rule",
        details=f"weight={rule.weight}, enabled={str(rule.enabled).lower()}",
    )

    return jsonify(rule.to_dict())


@admin_bp.get("/logs")
@admin_required
def list_logs():
    logs = []
    for log in AuditLogRepository.list_all():
        admin_user = UserRepository.find_by_id(log.admin_id)
        payload = log.to_dict()
        payload["admin_name"] = admin_user.name if admin_user else f"Admin #{log.admin_id}"
        logs.append(payload)
    return jsonify(logs[::-1])
