"""Authentication routes."""

import secrets
from datetime import datetime, timedelta, timezone

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from models.user_model import UserRepository
from services.email_service import send_email
from utils.jwt_utils import create_token, jwt_required

auth_bp = Blueprint("auth", __name__)


def _password_errors(password: str) -> list[str]:
    errors: list[str] = []

    if len(password) < 8:
        errors.append("Password must be at least 8 characters.")
    if not any(char.isupper() for char in password):
        errors.append("Password must include at least one uppercase letter.")
    if not any(char.islower() for char in password):
        errors.append("Password must include at least one lowercase letter.")
    if not any(char.isdigit() for char in password):
        errors.append("Password must include at least one number.")

    return errors


def _utc_timestamp_after(*, minutes: int = 0, hours: int = 0) -> int:
    return int((datetime.now(timezone.utc) + timedelta(minutes=minutes, hours=hours)).timestamp())


def _generate_verification_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _send_verification_code(email: str, code: str) -> tuple[bool, str]:
    subject = "Pause - Verify Your Email"
    body = (
        "Your verification code is: "
        f"{code}\n\n"
        "This code expires in 5 minutes."
    )

    sent, reason = send_email(email, subject, body)
    if not sent:
        print(f"[VERIFY CODE FALLBACK] email={email} code={code} reason={reason}")
    return sent, reason


def _generate_reset_token() -> str:
    return secrets.token_urlsafe(32)


def _send_reset_link(email: str, token: str) -> tuple[bool, str]:
    reset_link = f"http://localhost:5173/reset-password/?token={token}"
    subject = "Pause - Password Reset"
    body = (
        "Use this link to reset your password:\n"
        f"{reset_link}\n\n"
        "This link expires in 1 hour."
    )

    sent, reason = send_email(email, subject, body)
    if not sent:
        # Required local fallback if email is not configured.
        print(f"[PASSWORD RESET] email={email} link={reset_link} reason={reason}")
    return sent, reason


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    password_errors = _password_errors(password)
    if password_errors:
        return jsonify({"error": " ".join(password_errors)}), 400

    if UserRepository.find_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    user = UserRepository.create(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        role="user",
    )

    return (
        jsonify(
            {
                "message": "Registration successful.",
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "role": user.role,
                    "is_verified": user.is_verified,
                },
            }
        ),
        201,
    )


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}

    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    # Seed admin account lazily for local admin-route exploration.
    UserRepository.seed_admin()

    user = UserRepository.find_by_email(email)
    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is disabled. Contact support."}), 403

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if user.lock_until and user.lock_until > now_ts:
        return jsonify({"error": "Account is temporarily locked. Try again later."}), 423

    if user.password_hash == "seeded-admin-hash":
        password_ok = password == "admin123"
    else:
        password_ok = check_password_hash(user.password_hash, password)

    if not password_ok:
        lock_until = None
        if user.failed_login_attempts + 1 >= 5:
            lock_until = _utc_timestamp_after(minutes=10)
        UserRepository.increment_failed_login(user.id, lock_until=lock_until)
        return jsonify({"error": "Invalid credentials"}), 401

    UserRepository.reset_failed_login(user.id)

    token = create_token({"sub": user.id, "email": user.email, "role": user.role})

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role,
                "is_verified": user.is_verified,
                "created_at": user.created_at,
            },
        }
    )


@auth_bp.put("/profile")
@jwt_required
def update_profile():
    payload = request.get_json(silent=True) or {}

    name = (payload.get("name") or "").strip()
    email = (payload.get("email") or "").strip().lower()

    if not name or not email:
        return jsonify({"error": "name and email are required"}), 400

    user = UserRepository.find_by_id(request.user["sub"])
    if not user:
        return jsonify({"error": "User not found"}), 404

    existing = UserRepository.find_by_email(email)
    if existing and existing.id != user.id:
        return jsonify({"error": "Email already registered"}), 409

    updated_user = UserRepository.update_profile(user.id, name=name, email=email)
    if not updated_user:
        return jsonify({"error": "Unable to update profile"}), 400

    return jsonify(
        {
            "message": "Profile updated successfully",
            "user": {
                "id": updated_user.id,
                "name": updated_user.name,
                "email": updated_user.email,
                "role": updated_user.role,
                "is_verified": updated_user.is_verified,
                "created_at": updated_user.created_at,
            },
        }
    )


@auth_bp.post("/verify-code")
def verify_code():
    payload = request.get_json(silent=True) or {}

    email = (payload.get("email") or "").strip().lower()
    code = (payload.get("code") or "").strip()

    if not email or not code:
        return jsonify({"error": "email and code are required"}), 400

    user = UserRepository.find_by_email(email)
    if not user:
        return jsonify({"error": "Invalid verification request"}), 400

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if not user.verification_token or not user.verification_token_expiry:
        return jsonify({"error": "No verification code found. Request a new code."}), 400

    if user.verification_token_expiry < now_ts:
        return jsonify({"error": "Verification code expired. Request a new code."}), 400

    if user.verification_token != code:
        return jsonify({"error": "Invalid verification code"}), 400

    UserRepository.mark_verified(user.id)

    return jsonify({"message": "Email verified successfully"})


@auth_bp.post("/resend-code")
def resend_code():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "email is required"}), 400

    user = UserRepository.find_by_email(email)
    if not user:
        return jsonify({"error": "If this email exists, a code has been sent."})

    if user.is_verified:
        return jsonify({"message": "Email is already verified."})

    verification_code = _generate_verification_code()
    verification_expiry = _utc_timestamp_after(minutes=5)
    UserRepository.set_verification_code(user.id, verification_code, verification_expiry)
    sent, send_error = _send_verification_code(user.email, verification_code)
    if not sent:
        return (
            jsonify(
                {
                    "error": "Unable to resend verification email.",
                    "details": send_error,
                }
            ),
            503,
        )

    return jsonify({"message": "Verification code sent."})


@auth_bp.post("/forgot-password")
def forgot_password():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "email is required"}), 400

    user = UserRepository.find_by_email(email)
    if user:
        token = _generate_reset_token()
        expiry_ts = _utc_timestamp_after(hours=1)
        UserRepository.set_reset_token(user.id, token, expiry_ts)
        _send_reset_link(user.email, token)

    # Avoid account enumeration.
    return jsonify({"message": "If an account exists, a password reset link has been sent."})


@auth_bp.post("/reset-password")
def reset_password():
    payload = request.get_json(silent=True) or {}

    token = (payload.get("token") or "").strip()
    password = payload.get("password") or ""

    if not token or not password:
        return jsonify({"error": "token and password are required"}), 400

    password_errors = _password_errors(password)
    if password_errors:
        return jsonify({"error": " ".join(password_errors)}), 400

    user = UserRepository.find_by_reset_token(token)
    if not user or not user.reset_token_expiry:
        return jsonify({"error": "Invalid reset token"}), 400

    now_ts = int(datetime.now(timezone.utc).timestamp())
    if user.reset_token_expiry < now_ts:
        return jsonify({"error": "Reset token expired"}), 400

    UserRepository.set_password_hash(user.id, generate_password_hash(password))
    UserRepository.clear_reset_token(user.id)
    UserRepository.reset_failed_login(user.id)

    return jsonify({"message": "Password reset successful"})
