"""Email delivery helpers for verification and password reset flows."""

import smtplib
from email.message import EmailMessage

from flask import current_app


def send_email(to_email: str, subject: str, body: str) -> tuple[bool, str]:
    mail_host = current_app.config.get("MAIL_HOST", "").strip()
    mail_from = current_app.config.get("MAIL_FROM", "").strip()

    if not mail_host or not mail_from:
                return False, "Email service is not configured."

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = mail_from
    msg["To"] = to_email
    msg.set_content(body)

    mail_port = int(current_app.config.get("MAIL_PORT", 587))
    mail_username = current_app.config.get("MAIL_USERNAME", "")
    mail_password = current_app.config.get("MAIL_PASSWORD", "")
    mail_use_tls = bool(current_app.config.get("MAIL_USE_TLS", True))

    try:
        with smtplib.SMTP(mail_host, mail_port, timeout=15) as server:
            if mail_use_tls:
                server.starttls()
            if mail_username and mail_password:
                server.login(mail_username, mail_password)
            server.send_message(msg)
        return True, ""
    except Exception as exc:
        return False, str(exc)
