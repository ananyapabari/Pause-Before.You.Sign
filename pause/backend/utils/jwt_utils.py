"""Lightweight JWT-like token helpers.

This module provides a minimal token format for local development.
For production, replace with a hardened JWT library and key management.
"""

import base64
import hmac
import json
from datetime import datetime, timedelta, timezone
from functools import wraps
from hashlib import sha256

from flask import current_app, jsonify, request


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def _b64_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def create_token(payload: dict) -> str:
    """Create a signed token that follows JWT segment semantics."""
    header = {"alg": "HS256", "typ": "JWT"}
    full_payload = payload.copy()

    expires_hours = current_app.config.get("JWT_EXPIRES_HOURS", 6)
    exp = datetime.now(timezone.utc) + timedelta(hours=expires_hours)
    full_payload["exp"] = int(exp.timestamp())

    encoded_header = _b64_encode(json.dumps(header, separators=(",", ":")).encode("utf-8"))
    encoded_payload = _b64_encode(
        json.dumps(full_payload, separators=(",", ":")).encode("utf-8")
    )

    message = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    secret = current_app.config["SECRET_KEY"].encode("utf-8")
    signature = hmac.new(secret, message, sha256).digest()
    encoded_signature = _b64_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_token(token: str) -> dict:
    """Validate and decode token payload."""
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Invalid token format")

    encoded_header, encoded_payload, encoded_signature = parts
    message = f"{encoded_header}.{encoded_payload}".encode("utf-8")

    secret = current_app.config["SECRET_KEY"].encode("utf-8")
    expected_signature = hmac.new(secret, message, sha256).digest()
    actual_signature = _b64_decode(encoded_signature)

    if not hmac.compare_digest(expected_signature, actual_signature):
        raise ValueError("Invalid token signature")

    payload = json.loads(_b64_decode(encoded_payload).decode("utf-8"))
    if payload.get("exp", 0) < int(datetime.now(timezone.utc).timestamp()):
        raise ValueError("Token expired")

    return payload


def _extract_bearer_token() -> str:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return ""
    return auth_header.replace("Bearer ", "", 1).strip()


def jwt_required(handler):
    """Decorator that enforces authentication."""

    @wraps(handler)
    def wrapper(*args, **kwargs):
        token = _extract_bearer_token()
        if not token:
            return jsonify({"error": "Missing Bearer token"}), 401

        try:
            request.user = decode_token(token)
        except ValueError as exc:
            return jsonify({"error": str(exc)}), 401

        return handler(*args, **kwargs)

    return wrapper


def admin_required(handler):
    """Decorator that restricts a route to admin role."""

    @wraps(handler)
    @jwt_required
    def wrapper(*args, **kwargs):
        if request.user.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return handler(*args, **kwargs)

    return wrapper
