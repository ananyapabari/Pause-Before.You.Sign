"""Domain parsing and URL validation utilities."""

import re
from datetime import date, datetime, timezone
from typing import Any
from urllib.parse import urlparse

import whois


BIG_COMPANY_BRANDS = {
    "google",
    "microsoft",
    "amazon",
    "apple",
    "meta",
    "netflix",
    "linkedin",
    "paypal",
    "stripe",
    "adobe",
}

LEETSPEAK_MAP = str.maketrans(
    {
        "0": "o",
        "1": "l",
        "3": "e",
        "4": "a",
        "5": "s",
        "7": "t",
    }
)


def extract_domain(value: str) -> str:
    """Extract the domain from an email address or URL-like string."""
    if not value:
        return ""

    candidate = value.strip().lower()
    if "@" in candidate and " " not in candidate:
        return candidate.split("@", maxsplit=1)[1]

    if not candidate.startswith("http://") and not candidate.startswith("https://"):
        candidate = f"https://{candidate}"

    parsed = urlparse(candidate)
    return (parsed.netloc or "").replace("www.", "")


def _parse_creation_date(raw: Any) -> datetime | None:
    if not raw:
        return None

    if isinstance(raw, list):
        values = [item for item in raw if item]
        if not values:
            return None
        parsed_values = [dt for dt in (_parse_creation_date(item) for item in values) if dt]
        if not parsed_values:
            return None
        return min(parsed_values)

    if isinstance(raw, datetime):
        return raw if raw.tzinfo else raw.replace(tzinfo=timezone.utc)

    if isinstance(raw, date):
        return datetime(raw.year, raw.month, raw.day, tzinfo=timezone.utc)

    if isinstance(raw, str):
        candidate = raw.strip().replace("Z", "+00:00")
        try:
            parsed = datetime.fromisoformat(candidate)
            return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            return None

    return None


def get_domain_age(domain: str) -> tuple[int | None, datetime | None]:
    """Return WHOIS-based age in days and creation date. Returns (None, None) on failure."""
    if not domain:
        return None, None

    try:
        result = whois.whois(domain)
    except Exception:
        return None, None

    created_at = _parse_creation_date(getattr(result, "creation_date", None))
    if not created_at:
        return None, None

    age_days = (datetime.now(timezone.utc) - created_at).days
    return max(age_days, 0), created_at


def is_https(url: str) -> bool:
    """Return True when a URL starts with HTTPS."""
    return bool(url and url.strip().lower().startswith("https://"))


def is_suspicious_impersonation_domain(domain: str) -> bool:
    """Heuristically detect domains that appear to imitate known large brands."""
    if not domain:
        return False

    host = extract_domain(domain)
    if not host:
        return False

    # Keep SLD-focused checks: e.g. 'micros0ft-careers' from 'micros0ft-careers.com'
    sld = host.split(".", maxsplit=1)[0]
    compact = re.sub(r"[^a-z0-9]", "", sld.lower())
    compact_normalized = compact.translate(LEETSPEAK_MAP)

    if not compact:
        return False

    for brand in BIG_COMPANY_BRANDS:
        if brand in compact or brand in compact_normalized:
            # Exact matches like google.com or microsoft.com are not suspicious.
            if compact == brand or compact_normalized == brand:
                continue

            has_numeric_obfuscation = any(char.isdigit() for char in compact)
            has_extra_padding = len(compact) >= len(brand) + 3
            if has_numeric_obfuscation or has_extra_padding:
                return True

    return False
